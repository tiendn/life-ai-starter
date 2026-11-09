import { describe, expect, it } from 'vitest'
import { ApiError } from './client'
import { createApiQueryClient, retryDelay, retryRead } from './queryClient'

describe('API query client policy', () => {
  it('retries bounded network/transient errors and honors explicit retry safety', () => {
    expect(retryRead(0, new TypeError('network'))).toBe(true)
    expect(retryRead(2, new TypeError('network'))).toBe(false)
    expect(retryRead(0, new ApiError(401, { retry: 'wait' }))).toBe(false)
    expect(retryRead(0, new ApiError(409, { retry: 'same_request' }))).toBe(false)
    expect(retryRead(0, new ApiError(503, { retry: 'fix_request' }))).toBe(false)
    expect(retryRead(0, new ApiError(503, { retry: 'wait' }))).toBe(true)
    expect(retryRead(0, new ApiError(429))).toBe(true)
    expect(retryRead(0, new ApiError(501))).toBe(false)
    expect(retryDelay(2, new ApiError(503, { retry_after_seconds: 3 }))).toBe(3000)
    expect(retryDelay(8, new TypeError())).toBe(30_000)
  })
  it('disables mutations retries and offline queueing by default', () => {
    const client = createApiQueryClient()
    expect(client.getDefaultOptions().mutations).toMatchObject({ retry: false, gcTime: 0, networkMode: 'always' })
    client.clear()
  })
})
