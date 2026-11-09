import { transferableAbortController } from 'node:util'
import { act, renderHook, waitFor } from '@testing-library/react'
import { skipToken, useQueryClient } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { ApiProvider, type ApiSession } from './ApiProvider'
import { useApiMutation, useApiQuery, apiQueryKey } from './hooks'
import { createApiQueryClient } from './queryClient'
import { createApiClient } from './client'
import { server } from '../../test/mocks/server'

const nodeController = transferableAbortController()
vi.stubGlobal('AbortController', nodeController.constructor)
vi.stubGlobal('AbortSignal', nodeController.signal.constructor)
afterAll(() => vi.unstubAllGlobals())
const baseUrl = 'https://api.example.test'
const session: ApiSession = { baseUrl, authRevision: 'user-1:login-1', getToken: () => 'token-a' }
const url = `${baseUrl}/balances`
function wrapperFor(active: ApiSession = session) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <ApiProvider session={active}>{children}</ApiProvider>
  }
}

describe('generic API React Query foundation', () => {
  it('shares identical keys and separates filters while preserving decimals and nulls', async () => {
    const calls: string[] = []
    server.use(http.get(url, ({ request }) => {
      calls.push(new URL(request.url).search)
      return HttpResponse.json({ amount: '0.100000000000000001', available: null })
    }))
    const { result } = renderHook(() => ({
      client: useQueryClient(),
      first: useApiQuery(['balances', { wallet: 'one' }], { queryFn: ({ api, signal }) => api.request(`/balances?wallet=one`, { signal }) }),
      same: useApiQuery(['balances', { wallet: 'one' }], { queryFn: ({ api, signal }) => api.request(`/balances?wallet=one`, { signal }) }),
      other: useApiQuery(['balances', { wallet: 'two' }], { queryFn: ({ api, signal }) => api.request(`/balances?wallet=two`, { signal }) }),
    }), { wrapper: wrapperFor() })
    await waitFor(() => expect(result.current.first.isSuccess && result.current.other.isSuccess).toBe(true))
    expect(calls).toHaveLength(2)
    expect(result.current.same.data).toEqual({ amount: '0.100000000000000001', available: null })
    expect(result.current.client.getQueryCache().find({ queryKey: apiQueryKey('balances', { wallet: 'one' }) })).toBeDefined()
  })

  it('uses skipToken when query input is not ready', () => {
    const { result } = renderHook(() => useApiQuery(['balances', undefined], {
      queryFn: skipToken,
    }), { wrapper: wrapperFor() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('uses refreshed auth callbacks and replaces cache/cancels reads when identity changes', async () => {
    const seen: (string | null)[] = []
    let oldStarted = false
    let oldAborted = false
    let releaseOld: (() => void) | undefined
    server.use(http.get(url, async ({ request }) => {
      seen.push(request.headers.get('Authorization'))
      if (request.headers.get('Authorization') === 'Bearer old-token') {
        oldStarted = true
        request.signal.addEventListener('abort', () => { oldAborted = true })
        await new Promise<void>((resolve) => { releaseOld = resolve })
      }
      return HttpResponse.json({ amount: '1', available: null })
    }))
    let active = { ...session, getToken: () => 'old-token' }
    const wrapper = ({ children }: PropsWithChildren) => <ApiProvider session={active}>{children}</ApiProvider>
    const { result, rerender } = renderHook(() => ({
      query: useApiQuery(['balances'], { queryFn: ({ api, signal }) => api.request('/balances', { signal }) }),
      client: useQueryClient(),
    }), { wrapper })
    await waitFor(() => expect(oldStarted).toBe(true))
    const oldClient = result.current.client
    oldClient.setQueryData(['private'], 'prior-session-data')
    active = { ...session, authRevision: 'user-2:login-1', getToken: () => 'new-token' }
    rerender()
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
    expect(result.current.client).not.toBe(oldClient)
    expect(oldClient.getQueryCache().getAll()).toHaveLength(0)
    expect(oldAborted).toBe(true)
    expect(seen).toEqual(['Bearer old-token', 'Bearer new-token'])
    releaseOld?.()
  })

  it('uses a refreshed token callback while keeping the same principal cache', async () => {
    const seen: (string | null)[] = []
    server.use(http.get(url, ({ request }) => {
      seen.push(request.headers.get('Authorization'))
      return HttpResponse.json({ amount: '1' })
    }))
    let token = 'before-refresh'
    let active = { ...session, getToken: () => token }
    const wrapper = ({ children }: PropsWithChildren) => <ApiProvider session={active}>{children}</ApiProvider>
    const { result, rerender } = renderHook(() => ({
      query: useApiQuery(['balances'], { queryFn: ({ api, signal }) => api.request('/balances', { signal }) }),
      client: useQueryClient(),
    }), { wrapper })
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
    const cache = result.current.client
    token = 'after-refresh'
    active = { ...session, getToken: () => token }
    rerender()
    await act(async () => { await result.current.query.refetch() })
    expect(result.current.client).toBe(cache)
    expect(seen).toEqual(['Bearer before-refresh', 'Bearer after-refresh'])
  })

  it('ignores a late response from the previous filter after its request is aborted', async () => {
    let started = false
    let aborted = false
    let release: (() => void) | undefined
    server.use(http.get(url, async ({ request }) => {
      if (new URL(request.url).searchParams.get('filter') === 'old') {
        started = true
        request.signal.addEventListener('abort', () => { aborted = true })
        await new Promise<void>((resolve) => { release = resolve })
        return HttpResponse.json({ filter: 'old' })
      }
      return HttpResponse.json({ filter: 'new' })
    }))
    const { result, rerender } = renderHook(({ filter }: { filter: string }) => useApiQuery(['filtered', filter], {
      queryFn: ({ api, signal }) => api.request(`/balances?filter=${filter}`, { signal }),
    }), { initialProps: { filter: 'old' }, wrapper: wrapperFor() })
    await waitFor(() => expect(started).toBe(true))
    rerender({ filter: 'new' })
    await waitFor(() => expect(result.current.data).toEqual({ filter: 'new' }))
    expect(aborted).toBe(true)
    release?.()
    expect(result.current.data).toEqual({ filter: 'new' })
  })

  it('retries a transient server read then stops after bounded persistent failures', async () => {
    let calls = 0
    server.use(http.get(url, () => {
      calls++
      return calls < 3 ? HttpResponse.json({ error: 'retry' }, { status: 503 }) : HttpResponse.json({ value: 'ok' })
    }))
    const client = createApiQueryClient()
    try {
      const api = createTestClient()
      const query = client.fetchQuery({ queryKey: ['api', 'transient'], retryDelay: 0,
        queryFn: () => api.request('/balances') })
      await expect(query).resolves.toEqual({ value: 'ok' })
      expect(calls).toBe(3)
      server.use(http.get(url, () => { calls++; return HttpResponse.json({ error: 'still down' }, { status: 503 }) }))
      await expect(client.fetchQuery({ queryKey: ['api', 'persistent'], retryDelay: 0,
        queryFn: () => api.request('/balances') })).rejects.toMatchObject({ status: 503 })
      expect(calls).toBe(6)
    } finally { client.clear() }
  })

  it('never automatically resends mutations and retains the supplied idempotency key for explicit retry', async () => {
    const keys: (string | null)[] = []
    server.use(http.post(`${baseUrl}/update`, ({ request }) => {
      keys.push(request.headers.get('Idempotency-Key'))
      return keys.length === 1 ? HttpResponse.json({ error: 'unknown outcome' }, { status: 503 })
        : HttpResponse.json({ accepted: true }, { status: 202 })
    }))
    const { result } = renderHook(() => useApiMutation({ key: ['update'],
      mutationFn: ({ api, input, signal }) => api.request('/update', { method: 'POST', body: input, idempotencyKey: 'operation-1', signal }),
    }), { wrapper: wrapperFor() })
    await act(async () => { await expect(result.current.mutateAsync({ api_key: 'secret-fixture' })).rejects.toMatchObject({ status: 503 }) })
    expect(keys).toEqual(['operation-1'])
    await act(async () => { await result.current.mutateAsync({ api_key: 'secret-fixture' }) })
    expect(keys).toEqual(['operation-1', 'operation-1'])
  })

  it('guards concurrent submissions, keeps secret inputs out of mutation state and invalidates only requested keys', async () => {
    let release: (() => void) | undefined
    let requests = 0
    server.use(http.post(`${baseUrl}/credentials`, async () => {
      requests++
      await new Promise<void>((resolve) => { release = resolve })
      return HttpResponse.json({ accepted: true })
    }))
    const { result } = renderHook(() => ({
      mutation: useApiMutation({ key: ['credentials'],
        mutationFn: ({ api, input, signal }) => api.request('/credentials', { method: 'POST', body: input, signal }),
        invalidate: () => [apiQueryKey('balances')],
      }),
      client: useQueryClient(),
    }), { wrapper: wrapperFor() })
    result.current.client.setQueryData(apiQueryKey('balances'), { amount: '3' })
    result.current.client.setQueryData(apiQueryKey('activity'), [])
    let pending: Promise<unknown>
    act(() => { pending = result.current.mutation.mutateAsync({ password: 'secret-fixture' }) })
    await waitFor(() => expect(requests).toBe(1))
    await expect(result.current.mutation.mutateAsync({ password: 'secret-fixture' })).rejects.toThrow('already pending')
    expect(requests).toBe(1)
    expect(JSON.stringify(result.current.client.getMutationCache().getAll().map((entry) => entry.state)))
      .not.toContain('secret-fixture')
    await act(async () => { release?.(); await pending })
    await waitFor(() => expect(result.current.client.getQueryState(apiQueryKey('balances'))?.isInvalidated).toBe(true))
    expect(result.current.client.getQueryState(apiQueryKey('activity'))?.isInvalidated).toBe(false)
  })

  it('does not release the duplicate guard when reset aborts an in-flight write', async () => {
    let release: (() => void) | undefined
    server.use(http.post(`${baseUrl}/update`, async ({ request }) => {
      const body = await request.json() as { value: string }
      if (body.value === 'first') await new Promise<void>((resolve) => {
        release = resolve
        request.signal.addEventListener('abort', () => resolve(), { once: true })
      })
      return HttpResponse.json({ accepted: true })
    }))
    const { result } = renderHook(() => useApiMutation({ key: ['update'],
      mutationFn: ({ api, input, signal }) => api.request('/update', { method: 'POST', body: input, signal }),
    }), { wrapper: wrapperFor() })
    let pending: Promise<unknown>
    act(() => { pending = result.current.mutateAsync({ value: 'first' }) })
    await waitFor(() => expect(result.current.isPending).toBe(true))
    act(() => result.current.reset())
    await expect(result.current.mutateAsync({ value: 'second' })).rejects.toThrow('already pending')
    release?.()
    await expect(pending!).rejects.toMatchObject({ name: 'AbortError' })
    await act(async () => { await result.current.mutateAsync({ value: 'after-settled' }) })
  })
})

function createTestClient() {
  return createApiClient({ baseUrl, getToken: () => null })
}

