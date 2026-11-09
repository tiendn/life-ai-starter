---
name: routing-navigation
description: Add or change routes, navigation links, active states, route parameters or page transitions in LifeAI FE Starter using its existing TanStack Router code-based setup. Use for URL/navigation tasks; do not migrate to file-based routing without explicit approval.
---

# Extend the current router

Read `src/app/router.tsx`, `src/app/AppShell.tsx`, [Architecture](../../../docs/ARCHITECTURE.md) and [TanStack code-based routing](https://tanstack.com/router/latest/docs/routing/code-based-routing).

## Procedure

1. Identify the intended URL, page name, parent layout, parameters and expected navigation entry. Avoid routes that are just internal modal states unless URL identity has user value.
2. Put page composition in `src/pages/`. Feature behavior belongs in `src/features/<name>/`. Keep `src/app/router.tsx` as the source of route registration.
3. Create a `createRoute({ getParentRoute: () => rootRoute, path: '/name', component: Page })` and add it to `rootRoute.addChildren([...])`. Keep the `Register` module augmentation pointing to the router.
4. Use typed TanStack `<Link to="/name">` (or router navigation APIs) instead of raw anchors for client-side routes. Preserve active link styles and correct semantics.
5. Update `AppShell.tsx` navigation only when the destination belongs in global navigation. Validate desktop and mobile menus, click-to-close, active-state styling and focus.
6. If dynamic params/search are needed, use TanStack's typed route APIs; validate URL-derived inputs before passing to APIs. Do not manually parse `window.location` in feature components.
7. Cover direct URL load, back/forward navigation, unknown route/404 and mobile navigation in Playwright. Keep the current reduced-motion page transitions.

## Checks

Run `pnpm run typecheck`, `pnpm run test:e2e`, and `pnpm run test:a11y` if navigation changed; check `/` and `/ui-kit` still work.

## Scope guard

The starter intentionally uses **code-based** TanStack Router even though the upstream project may recommend file-based routing for other applications. Don't silently introduce generators or reorganize route files.
