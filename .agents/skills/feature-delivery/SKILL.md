---
name: feature-delivery
description: Build a new user-facing frontend feature end to end in LifeAI FE Starter. Use for requests to add a feature, module, dashboard section or product flow; coordinate architecture, page composition, routing, tests and documentation. Do not use for an isolated UI primitive or bug-only fix.
---

# Deliver a frontend feature

- [Feature acceptance worksheet](references/feature-checklist.md) for multi-file flows.
## Read first

- [Architecture](../../../docs/ARCHITECTURE.md), [design system](../../../docs/DESIGN_SYSTEM.md), [testing](../../../docs/TESTING.md), and repository `AGENTS.md`.
- Inspect the actual neighboring files and feature conventions. This starter intentionally has **no sample business feature**.

## Workflow

1. **Translate the request into outcomes.** Write a brief acceptance checklist: entry point; user action; loading/empty/error/success states; responsive and accessibility expectations. Do not invent a backend contract.
2. **Map ownership.** Feature logic, hooks, types and feature UI belong in `src/features/<kebab-name>/`. Put only route-level composition in `src/pages/`; global wiring goes to `src/app/`. General-purpose components belong in `src/shared/` only after proving reuse. Sketch the page → feature block → shared primitive composition using [component boundary criteria](../../../docs/ARCHITECTURE.md#component-composition); identify which orchestration stays in the page.
3. **Design minimal contracts.** Define explicit TypeScript props and data types; prefer small pure selectors/transforms. Keep network boundaries in typed adapters and [TanStack Query](../api-server-state/SKILL.md) rather than JSX.
4. **Implement UI with existing tokens and components.** Reuse `Surface`, `Button`, `Input`, `EmptyState`, `MotionPage`; use semantic Tailwind classes. Check light/dark, 320–390px mobile widths and desktop.
5. **Wire page and route.** Add a page in `src/pages/`, use code-based `createRoute` in `src/app/router.tsx`, and add navigation in `AppShell.tsx` only when discoverability warrants it. Preserve the typed router registration.
6. **Protect behavior.** Add colocated Vitest/Testing Library tests, MSW mocks only if an API is involved, and Playwright for important journeys. Include negative/error and keyboard paths.
7. **Run quality gates and explain results.** `pnpm run skills:check`, `pnpm run check`, relevant `pnpm run test:e2e`, and visual/a11y checks for changed interaction/layout. Never claim passes without execution.

## Optional scaffold

```bash
node scripts/scaffold-feature.mjs profile --dry-run
node scripts/scaffold-feature.mjs profile
```

Creates a small component, colocated test and page, **not** a route or fake API. Review and replace the placeholders; follow [Routing & Navigation](../routing-navigation/SKILL.md).

## Definition of done

- Feature boundary remains isolated; no restored Vesting/blockchain code.
- UI supports light/dark, keyboard, mobile and all relevant async states.
- Real tests/assertions are added; docs updated only when behavior or conventions change.
- Handoff names changed files, observed checks, and any unverified assumptions.
