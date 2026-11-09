export type ApiErrorBody = {
  error?: string
  code?: string | null
  detail?: string | null
  request_id?: string | null
  retry?: string | null
  retry_after_seconds?: number | null
  fields?: { path: string; code: string }[]
}

export class ApiError extends Error {
  readonly requestId?: string
  readonly retryAfterSeconds?: number

  constructor(readonly status: number, readonly body?: ApiErrorBody, requestIdHeader?: string | null, retryAfterHeader?: string | null) {
    super(body?.detail ?? body?.error ?? `Request failed with status ${status}`)
    this.name = 'ApiError'
    this.requestId = body?.request_id ?? requestIdHeader ?? undefined
    const headerSeconds = retryAfterHeader == null ? NaN : Number(retryAfterHeader)
    const headerDateSeconds = retryAfterHeader == null ? NaN : (Date.parse(retryAfterHeader) - Date.now()) / 1000
    this.retryAfterSeconds = Number.isFinite(headerSeconds) && headerSeconds >= 0 ? headerSeconds
      : Number.isFinite(headerDateSeconds) && headerDateSeconds >= 0 ? headerDateSeconds
        : body?.retry_after_seconds ?? undefined
  }
}

export type ApiClientOptions = {
  baseUrl: string
  getToken?: () => string | undefined | null | Promise<string | undefined | null>
  fetch?: typeof globalThis.fetch
}
export type ApiRequestOptions = Omit<RequestInit, 'body' | 'headers' | 'method'> & {
  method?: string
  headers?: HeadersInit
  body?: unknown
  idempotencyKey?: string
}
export type ApiClient = { request<T>(path: string, options?: ApiRequestOptions): Promise<T> }

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
function parseErrorBody(value: unknown): ApiErrorBody | undefined {
  if (!isRecord(value)) return undefined
  const fields = Array.isArray(value.fields)
    ? value.fields.filter((field): field is Record<string, unknown> => isRecord(field) &&
      typeof field.path === 'string' && typeof field.code === 'string')
      .map((field) => ({ path: field.path as string, code: field.code as string }))
    : undefined
  return {
    ...(typeof value.error === 'string' ? { error: value.error } : {}),
    ...(typeof value.code === 'string' || value.code === null ? { code: value.code as string | null } : {}),
    ...(typeof value.detail === 'string' || value.detail === null ? { detail: value.detail as string | null } : {}),
    ...(typeof value.request_id === 'string' || value.request_id === null ? { request_id: value.request_id as string | null } : {}),
    ...(typeof value.retry === 'string' || value.retry === null ? { retry: value.retry as string | null } : {}),
    ...(typeof value.retry_after_seconds === 'number' && Number.isFinite(value.retry_after_seconds) && value.retry_after_seconds >= 0
      ? { retry_after_seconds: value.retry_after_seconds } : {}),
    ...(fields ? { fields } : {}),
  }
}
function isBodyInit(value: unknown): value is BodyInit {
  return typeof value === 'string' || value instanceof Blob || value instanceof FormData ||
    value instanceof URLSearchParams || value instanceof ArrayBuffer || ArrayBuffer.isView(value) ||
    (typeof ReadableStream !== 'undefined' && value instanceof ReadableStream)
}

export function createApiClient({ baseUrl, getToken, fetch: fetchImpl = globalThis.fetch }: ApiClientOptions): ApiClient {
  return {
    async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
      const { body, headers: providedHeaders, idempotencyKey, ...init } = options
      const headers = new Headers(providedHeaders)
      const token = await getToken?.()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey)
      let requestBody: BodyInit | undefined
      if (body !== undefined && body !== null) {
        if (isBodyInit(body)) requestBody = body
        else {
          headers.set('Content-Type', 'application/json')
          requestBody = JSON.stringify(body)
        }
      }
      const url = `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
      const response = await fetchImpl(url, { ...init, method: options.method ?? (body !== undefined && body !== null ? 'POST' : 'GET'), headers, body: requestBody })
      if (!response.ok) {
        let errorBody: ApiErrorBody | undefined
        try { errorBody = parseErrorBody(await response.json()) } catch { /* Keep status/request metadata for non-JSON errors. */ }
        throw new ApiError(response.status, errorBody, response.headers.get('X-Request-ID'), response.headers.get('Retry-After'))
      }
      if (response.status === 204) return undefined as T
      return await response.json() as T
    },
  }
}

