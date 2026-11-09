---
name: testing-quality
description: Design, add or repair frontend tests and quality gates for LifeAI FE Starter. Use for Vitest, Testing Library, MSW, Playwright E2E, accessibility checks, visual regressions, coverage, ESLint and CI failures; avoid weakening checks just to get a green build.
---

# Test behavior, not implementation

Read [Testing](../../../docs/TESTING.md), `vite.config.ts`, `playwright.config.ts`, `eslint.config.mjs` and `.github/workflows/ci.yml` before changing test infrastructure.

[Test coverage matrix](references/test-matrix.md) maps change types to useful evidence.

## Test choice

| Change | Minimum useful proof |
| --- | --- |
| Pure data transform | Vitest input/output and edge cases |
| Shared UI component | Testing Library role/name, click/keyboard, disabled/error |
| API hook or async page | MSW success/empty/error and cache behavior |
| Navigation, user-critical flow | Playwright `getByRole`/`getByLabel` E2E |
| Modal/form/focus work | Playwright keyboard + axe-core |
| Stable layout, theme | Reviewed visual screenshots on consistent Chromium |

## Workflow

1. State the user-observable invariant; start with a regression test for each bug.
2. Use `screen.getByRole`, `userEvent`, and Playwright locators instead of fragile CSS selectors or arbitrary timeouts. Keep tests isolated and deterministic.
3. Mock HTTP with MSW; `src/test/setup.ts` already resets handlers and errors on unhandled requests.
4. Use explicit async waits and user-visible assertions; avoid checking incidental implementation state.
5. Run focused tests during development; before delivery run quality gates:

```bash
pnpm run skills:check
pnpm run lint
pnpm run typecheck
pnpm run test:coverage
pnpm run build
pnpm run test:e2e
pnpm run test:a11y
```

6. Run `pnpm run test:visual` **only after reviewed baseline PNGs exist**. Bootstrap with `pnpm run test:visual:update` on Linux/Chromium and review the snapshots manually; never auto-approve UI diffs.

## Critical caveats

- Current coverage gates cover selected shared/theme files, **not every future feature**; expand coverage scope for new high-value feature code.
- Accessibility test configuration temporarily excludes color contrast; no WCAG compliance claim follows from a green run.
- Use pnpm and `pnpm-lock.yaml`; CI installs with `pnpm install --frozen-lockfile`. Update the lockfile with `pnpm install` when changing dependencies.
- If tooling/dependencies aren't available, report **not executed**, not “passed”.

[Playwright best practices](https://playwright.dev/docs/best-practices) favor user-facing assertions and independent tests.
