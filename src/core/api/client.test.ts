import { describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { createApiClient, ApiError } from './client'
import { server } from '../../test/mocks/server'

const base = 'https://api.test/v1'

describe('createApiClient', () => {
  it('sends refreshed auth/idempotency headers and preserves decimal strings and nulls', async () => {
    const tokens = ['first', 'second']
    const auth: string[] = []
    server.use(http.post(`${base}/orders`, ({ request }) => {
      auth.push(request.headers.get('authorization') ?? '')
      expect(request.headers.get('Idempotency-Key')).toBe('operation-1')
      return HttpResponse.json({ amount: '0.100000000000000001', unknown: null })
    }))
    const api = createApiClient({ baseUrl: base, getToken: () => tokens.shift() })
    expect(await api.request('/orders', { method: 'POST', idempotencyKey: 'operation-1', body: { amount: '0.1' } }))
      .toEqual({ amount: '0.100000000000000001', unknown: null })
    await api.request('/orders', { method: 'POST', idempotencyKey: 'operation-1', body: { amount: '0.2' } })
    expect(auth).toEqual(['Bearer first', 'Bearer second'])
  })
  it('returns undefined for 204 and passes cancellation through', async () => {
    const controller = new AbortController()
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    const api = createApiClient({ baseUrl: base, fetch })
    expect(await api.request<void>('/empty', { method: 'DELETE', signal: controller.signal })).toBeUndefined()
    expect(fetch.mock.calls[0]?.[1]?.signal).toBe(controller.signal)
  })
  it('uses POST for an explicitly supplied empty body', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    await createApiClient({ baseUrl: base, fetch }).request('/empty-string', { body: '' })
    expect(fetch.mock.calls[0]?.[1]?.method).toBe('POST')
    expect(fetch.mock.calls[0]?.[1]?.body).toBe('')
  })
  it('parses safe validation fields and honors Retry-After header/request ID', async () => {
    server.use(http.get(`${base}/bad`, () => HttpResponse.json({ error: 'invalid', request_id: 'r-1', fields: [{ path: 'amount', code: 'invalid' }, { path: 2 }] }, {
      status: 422, headers: { 'Retry-After': '3' },
    })))
    try { await createApiClient({ baseUrl: base }).request('/bad'); throw new Error('expected rejection') }
    catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({ status: 422, requestId: 'r-1', retryAfterSeconds: 3,
        body: { fields: [{ path: 'amount', code: 'invalid' }] } })
    }
  })
  it('preserves status on invalid JSON error responses and reports network errors', async () => {
    const api = createApiClient({ baseUrl: base, fetch: vi.fn().mockResolvedValue(new Response('no json', { status: 503 })) })
    await expect(api.request('/broken')).rejects.toMatchObject({ status: 503 })
    const offline = createApiClient({ baseUrl: base, fetch: vi.fn().mockRejectedValue(new TypeError('offline')) })
    await expect(offline.request('/offline')).rejects.toThrow('offline')
  })
  it('falls back to the request ID header and accepts Retry-After dates', async () => {
    const retryAt = new Date(Date.now() + 5_000).toUTCString()
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'busy' }), {
      status: 503, headers: { 'X-Request-ID': 'header-id', 'Retry-After': retryAt },
    }))
    try { await createApiClient({ baseUrl: base, fetch }).request('/busy'); throw new Error('expected rejection') }
    catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({ requestId: 'header-id', status: 503 })
      expect((error as ApiError).retryAfterSeconds).toBeGreaterThan(0)
      expect((error as ApiError).retryAfterSeconds).toBeLessThanOrEqual(5)
    }
  })
})
