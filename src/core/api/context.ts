import { createContext, useContext } from 'react'
import type { ApiClient } from './client'

export const ApiContext = createContext<ApiClient | null>(null)
export function useApiClient() {
  const client = useContext(ApiContext)
  if (!client) throw new Error('useApiClient requires an ApiProvider with a configured session')
  return client
}

