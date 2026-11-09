# API and server state

The starter includes a reusable HTTP client, an isolated API/session provider,
React Query hooks and offline OpenAPI type generation. Applications supply their
own backend URL, authentication callback, contract and feature adapters. No live
backend, endpoint catalogue, login screen or product workflow is bundled.

## Choose the state owner

| State | Owner |
| --- | --- |
| Backend observations, lists, loading/errors, pagination and mutations | TanStack Query |
| Local form inputs and temporary component UI | React state |
| Shareable filters, pagination and navigation | TanStack Router search parameters |
| Cross-route client state that cannot be derived from the above | Add a scoped store such as Zustand when a concrete feature needs it |

Do not copy query responses into a Zustand store. That creates two caches with
separate invalidation and freshness rules. Zustand is not installed by default;
adding it should solve an identified shared client-state requirement.

## Configure the service and authentication boundary

Pass the application's session to `AppProviders` (or `ApiProvider` directly):

```tsx
<AppProviders apiSession={{
  baseUrl: serviceUrl,
  authRevision: principalId + ':' + loginRevision,
  getToken: getCurrentAccessToken,
}}>
  <Application />
</AppProviders>
```

`baseUrl` is the backend API prefix. `getToken` may be asynchronous and is read on
every request; the provider uses the latest callback when tokens refresh. Neither
tokens nor credentials belong in `VITE_*`, query keys, logs or browser persistence.
`authRevision` is a non-secret identifier: change it for login/logout, user,
permission or account changes. A new service/revision creates a fresh QueryClient,
cancels old reads and clears the old query/mutation caches. It does not reverse
backend writes that may already have been accepted.

Without a configured session the starter continues to render without API requests.
Feature code that consumes the HTTP context requires a configured session. Keep
identity-scoped query options inside the provider's QueryClient, rather than
sharing them across users.

## HTTP boundary and feature hooks

`src/core/api/client.ts` provides `createApiClient`, `ApiError` and the request types.
The client joins relative paths to the configured service prefix, applies the
current bearer token, forwards AbortSignal and caller-provided idempotency headers,
serializes JSON and preserves string amounts and nulls. Non-success responses
throw `ApiError` with HTTP status and safe structured metadata; transport failures,
cancellation and malformed success JSON reject normally. Success payload types
are compile-time declarations, not runtime schema validation. Add boundary
validation in a feature adapter where the application's correctness requires it.

Feature adapters bind real paths and generated request/response types. Hooks do
not fetch from presentational JSX:

```text
page → feature hook → typed feature adapter → HTTP client → backend
```

`useApiQuery(key, { queryFn, ...queryOptions })` provides the current API client and
AbortSignal to `queryFn`. Include every path/filter/account variable in the key.
Use `skipToken` when a required ID is missing, rather than fetching an empty ID.
`enabled: false` pauses a configured query but still allows manual refetch.
Polling is opt-in through standard React Query options; the starter does not
invent intervals or terminal receipt states for an unknown backend.

Read retries are bounded and restricted to network/transient HTTP failures. They
honor supported backend retry hints. Validation/authentication/conflict failures,
abort and JSON parse failures do not receive automatic retries. A failed refresh
retains the previous observation; retain its original timestamp in the UI.
Independent keys keep optional report failures independent of operational panels.

`useApiMutation({ key, mutationFn, invalidate })` exposes `mutateAsync`, status,
result/error and reset. Reset or unmount may abort the transport, which does not
prove a backend write was rolled back; retain the original operation identity for
recovery. `mutationFn` receives `{ api, input, signal }`; the feature
adapter owns the HTTP method, path, generated body and explicit idempotency key.
`useApiQuery` prefixes keys with `api`. Use the exported `apiQueryKey(...parts)`
helper when returning matching keys from `invalidate`; for example,
`invalidate: () => [apiQueryKey('feature')]` matches queries created with
`useApiQuery(['feature', filters], ...)`. It also supports explicit keys for
other query families. Successful mutations invalidate only the keys returned by
the feature's callback.
Automatic mutation retries, offline queuing and optimistic writes are disabled.
A duplicate in-flight submission from one hook is rejected. Backend idempotency
still owns duplicates across components, reloads and concurrent operators.

Potentially secret inputs are kept outside React Query's mutation variables;
only opaque tickets enter its mutation cache. Clear credential form fields after
submission and never persist secret-bearing forms. Do not return secrets in
mutation results. No query-cache persistence or Devtools is installed.

For an asynchronous backend, a successful HTTP response may mean acceptance.
Follow its receipt separately and refresh related observations when terminal.
Explicit retry after a lost response must reuse the original request identity;
a timeout does not prove that a write was never accepted. Receipt polling,
resumable operation IDs, cursor pagination and invalidation dependencies belong
to the feature's verified backend contract.

## Generate types from a backend contract

`openapi-typescript` is a pinned development dependency. Supply a local OpenAPI
file exported from the backend:

```sh
pnpm run api:generate --input path/to/openapi.json --output src/core/api/generated/schema.d.ts
pnpm run api:check --input path/to/openapi.json --output src/core/api/generated/schema.d.ts
```

The generator has no default production schema. It generates deterministically,
creates output directories, rejects identical input/output (including file aliases), and does not overwrite
existing types on an invalid contract. Check mode detects missing/stale output
without writing files. External references require their own available sources;
use a self-contained local contract for fully offline generation.

Commit the exported schema and generated declarations when using this workflow.
Have the backend's contract-generation command invoke `api:generate` afterward;
run `api:check` with the same input/output paths in the consuming project's CI.
The generic starter CI tests generator behavior using a synthetic test-only
contract. It cannot check drift against an application backend that has not yet
been chosen. Generated declarations are excluded from ESLint but their consumers
are checked by TypeScript. Never manually edit them.

## Verification boundaries

MSW tests exercise the transport and hooks without real credentials or a server.

| Layer | Relevant cases |
| --- | --- |
| HTTP | Success/null/decimal strings, structured and malformed failures, auth callback refresh, cancellation and explicit idempotency |
| Queries/session | Cache-key separation, same-key sharing, transient/persistent retry, independent queries, old-request cancellation and identity isolation |
| Mutations | No automatic retry, in-flight duplicate guard, explicit invalidation and secret-free cached variables |
| Generation | Deterministic output, missing/stale checks, bad-contract preservation, source protection and CLI arguments |
| Application delivery | Real auth/CORS, cross-operator effects, receipt persistence/reload UI and browser feature acceptance |

Run `pnpm run check`. Add browser tests when integrating a user-facing workflow;
API unit tests cannot qualify an application's hosted authentication, production
backend or external side effects. Visual baselines require separate review.

References: [TanStack Query](https://tanstack.com/query/v5/docs/framework/react/overview),
[query keys](https://tanstack.com/query/v5/docs/framework/react/guides/query-keys),
[mutations](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation),
[OpenAPI TypeScript](https://openapi-ts.dev/).
