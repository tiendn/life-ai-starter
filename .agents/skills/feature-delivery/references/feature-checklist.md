# Feature delivery acceptance worksheet

Use this worksheet when a feature spans multiple files or a new route. Fill only what is known; label unknown data contracts as **unknown**, never assume.

## User objective

- Problem to solve:
- Primary action and expected outcome:
- URL / entry point:
- Roles or permissions (if confirmed):

## Experience contract

| State | What the person sees | Available action | Test evidence |
| --- | --- | --- | --- |
| Initial | | | |
| Loading | | | |
| Empty | | | |
| Error | | Retry or recovery | |
| Success | | | |

## Implementation ownership

- `src/features/<slug>/`: component(s), hook(s), types, tests
- `src/pages/`: one thin page composition
- `src/app/router.tsx`: code-based route registration
- `src/app/AppShell.tsx`: global link **only when necessary**
- `src/core/`: reusable integration adapter when real endpoint is known
- `src/shared/`: reusable primitives only when justified

## Component boundaries

- Existing primitives to reuse:
- Feature blocks and the responsibility of each:
- Route orchestration and simple markup kept in the page:
- New shared component, if any: concrete reuse or design-system contract:

## Sign-off

- [ ] Composition reviewed against Architecture; repeated state UI and unnecessary wrappers considered
- [ ] Small-screen & desktop behavior verified
- [ ] Light & dark checked
- [ ] Keyboard/focus and meaningful labels verified
- [ ] Loading/empty/error/success considered
- [ ] Relevant Vitest + E2E + accessibility coverage
- [ ] Lint, typecheck, coverage, build run or blockers disclosed
- [ ] No fabricated backend contracts or Vesting/blockchain restoration
