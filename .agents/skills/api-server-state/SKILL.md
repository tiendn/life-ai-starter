---
name: api-server-state
description: Connect a real backend endpoint, implement a typed frontend API adapter, or manage asynchronous server state with TanStack Query and MSW. Use for fetching, caching, mutations, error handling and API mocks; do not fabricate endpoints, response fields, credentials or live data.
---

# Integrate real APIs safely

## Preparation

Read `src/app/AppProviders.tsx`, `src/test/mocks/`, [Architecture](../../../docs/ARCHITECTURE.md) and [Testing](../../../docs/TESTING.md). Require a verified API contract (docs/schema/example from owner). If unavailable, implement an explicitly isolated interface without pretending the backend exists.

## Data flow

`route/page → feature hook → typed API adapter (core/ or feature-local) → HTTP boundary`.

1. Define DTOs separately from presentation models when transformations are meaningful. Validate untrusted payloads at the boundary when correctness or safety requires it; add a validator library only with justification.
2. Keep request base URL/config in one location; `VITE_*` values are **public** and cannot store secrets. Handle non-2xx responses and cancellation (`AbortSignal`). Never log auth tokens or personal data.
3. Use TanStack Query for server state; choose stable query keys that contain all variables influencing the query. Distinguish `isPending`, fetching/refetching, empty results and errors.
4. Mutations should show appropriate pending/error/success feedback, disable duplicate submissions where needed, and invalidate only related query keys after success. Avoid optimistic updates unless rollback behavior is defined.
5. Keep local UI state in React; avoid copying query results into state via Effects. See [React guidance](https://react.dev/learn/you-might-not-need-an-effect).
6. Use MSW Node setup from `src/test/mocks/server.ts` in component/hook tests. Model success, empty, error, slow/retry and unexpected response cases. Never rely on a live production endpoint in CI.
7. Ensure unmounted navigation does not show stale results or cross-user cache data. Confirm auth-dependent query keys/invalidation when login is introduced.

## Review checklist

- Contract and error handling are explicit; no made-up fields.
- Correct cache key and mutation invalidation policy.
- User-visible, accessible pending/empty/error feedback.
- Deterministic MSW tests and no leaked tokens/secrets.
- `pnpm run check` and relevant E2E executed (or limitations disclosed).

## References

- [TanStack Query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [TanStack invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
