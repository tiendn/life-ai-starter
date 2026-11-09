import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { ThemeProvider } from '../theme/useTheme'
import { ApiProvider, type ApiSession } from '../core/api/ApiProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export function AppProviders({ children, apiSession }: PropsWithChildren<{ apiSession?: ApiSession }>) {
  const queryState = apiSession
    ? <ApiProvider session={apiSession}>{children}</ApiProvider>
    : <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  return (
    <ThemeProvider>
      {queryState}
    </ThemeProvider>
  )
}
