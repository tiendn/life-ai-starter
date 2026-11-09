import { useEffect, useRef } from 'react'
import { skipToken, useMutation, useQuery, useQueryClient, type QueryKey, type UseQueryOptions } from '@tanstack/react-query'
import { useApiClient } from './context'

export type ApiQueryContext = { api: ReturnType<typeof useApiClient>; signal: AbortSignal }
export type ApiQueryOptions<T> = Omit<UseQueryOptions<T, Error, T, QueryKey>, 'queryKey' | 'queryFn'> & {
  queryFn: typeof skipToken | ((context: ApiQueryContext) => Promise<T>)
}
export const apiQueryKey = (...key: QueryKey): QueryKey => ['api', ...key]

/** Feature adapters supply the key and typed request function; query state stays in React Query. */
export function useApiQuery<T>(key: QueryKey, options: ApiQueryOptions<T>) {
  const api = useApiClient()
  const queryFn = options.queryFn
  return useQuery<T, Error, T, QueryKey>({
    ...options,
    queryKey: apiQueryKey(...key),
    queryFn: queryFn === skipToken ? skipToken : ({ signal }) => queryFn({ api, signal }),
  })
}

export type ApiMutationOptions<TData, TInput> = {
  key: QueryKey
  mutationFn: (context: { api: ReturnType<typeof useApiClient>; input: TInput; signal: AbortSignal }) => Promise<TData>
  invalidate?: (data: TData) => readonly QueryKey[]
}

/**
 * Keep potentially secret inputs outside React Query mutation variables. Consumers receive
 * only status/data and the typed execute function; cache variables contain opaque tickets.
 */
export function useApiMutation<TData, TInput>({ key, mutationFn, invalidate }: ApiMutationOptions<TData, TInput>) {
  const api = useApiClient()
  const client = useQueryClient()
  const requests = useRef(new Map<string, { input: TInput; controller: AbortController }>())
  const activeTicket = useRef<string | null>(null)
  const nextId = useRef(0)
  const mutation = useMutation<TData, Error, string>({
    mutationKey: apiQueryKey(...key),
    mutationFn: async (ticket) => {
      const request = requests.current.get(ticket)
      if (!request) throw new Error('Mutation input is no longer available')
      return mutationFn({ api, input: request.input, signal: request.controller.signal })
    },
    retry: false,
    gcTime: 0,
    networkMode: 'always',
    onSuccess: async (data) => {
      if (invalidate) {
        await Promise.all(invalidate(data).map((queryKey) => client.invalidateQueries({ queryKey })))
      }
    },
  })
  const execute = async (input: TInput) => {
    if (activeTicket.current !== null) throw new Error('A request is already pending')
    const ticket = String(++nextId.current)
    activeTicket.current = ticket
    const controller = new AbortController()
    requests.current.set(ticket, { input, controller })
    try { return await mutation.mutateAsync(ticket) }
    finally {
      requests.current.delete(ticket)
      if (activeTicket.current === ticket) activeTicket.current = null
    }
  }
  const reset = () => {
    requests.current.forEach(({ controller }) => controller.abort())
    requests.current.clear()
    mutation.reset()
  }
  useEffect(() => () => {
    requests.current.forEach(({ controller }) => controller.abort())
    requests.current.clear()
  }, [])
  const { variables: _ticket, mutate: _mutate, mutateAsync: _mutateAsync, ...result } = mutation
  return { ...result, mutateAsync: execute, reset }
}

