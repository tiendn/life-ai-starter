import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './client'

export function retryRead(failures: number, error: Error): boolean {
  if (failures >= 2) return false
  if (error instanceof ApiError) {
    const retryableStatus = error.status === 429 || error.status >= 500 && error.status !== 501 && error.status !== 505
    if (!retryableStatus) return false
    if (error.body?.retry != null) return ['wait', 'same_request'].includes(error.body.retry)
    return true
  }
  return error instanceof TypeError
}
export function retryDelay(attempt: number, error: Error): number {
  if (error instanceof ApiError && error.retryAfterSeconds !== undefined) return error.retryAfterSeconds * 1000
  return Math.min(1000 * 2 ** attempt, 30_000)
}
export function createApiQueryClient() {
  return new QueryClient({ defaultOptions: {
    queries: { staleTime: 15_000, retry: retryRead, retryDelay, refetchOnWindowFocus: true, refetchOnReconnect: true },
    mutations: { retry: false, gcTime: 0, networkMode: 'always' },
  } })
}

