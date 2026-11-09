import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ApiContext } from './context'
import { createApiClient, type ApiClientOptions } from './client'
import { createApiQueryClient } from './queryClient'

export type ApiSession = ApiClientOptions & {
  /** Non-secret revision that changes on login, logout, or principal/permission changes. */
  authRevision: string
}
function ScopedProvider({ session, children }: PropsWithChildren<{ session: ApiSession }>) {
  const current = useRef(session)
  current.current = session
  const [queryClient] = useState(createApiQueryClient)
  const [api] = useState(() => createApiClient({
    ...session,
    getToken: () => current.current.getToken?.(),
  }))
  useEffect(() => () => {
    void queryClient.cancelQueries()
    queryClient.clear()
  }, [queryClient])
  return <QueryClientProvider client={queryClient}><ApiContext.Provider value={api}>{children}</ApiContext.Provider></QueryClientProvider>
}

/** Owns a private query cache for the service and authenticated principal. */
export function ApiProvider({ session, children }: PropsWithChildren<{ session?: ApiSession }>) {
  if (!session) return <>{children}</>
  const key = JSON.stringify([session.baseUrl, session.authRevision])
  return <ScopedProvider key={key} session={session}>{children}</ScopedProvider>
}

