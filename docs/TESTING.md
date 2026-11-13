# Testing and quality gates

This is a **frontend starter**, not an integration with Life Vesting. The MSW fixture
is an example endpoint only; no external API, wallet or smart contract is required.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm run lint` | ESLint 9 flat config, TypeScript, hooks and JSX accessibility rules; zero-warning gate |
| `pnpm run lint:fix` | Apply ESLint's safe automatic fixes |
| `pnpm run typecheck` | TypeScript (strict) |
| `pnpm run test` | Watch-mode Vitest unit/component tests |
| `pnpm run test:run` | One-time unit/component tests |
| `pnpm run test:coverage` | Vitest V8 code coverage and enforced thresholds |
| `pnpm run test:e2e` | Playwright Chromium behavior and accessibility tests (non-visual) |
| `pnpm run test:a11y` | Playwright axe-core/keyboard-only tests |
| `pnpm run test:visual:update` | Capture and update baseline PNGs on a Linux/Chromium environment |
| `pnpm run test:visual` | Compare current screenshots against committed PNG baselines |
| `pnpm run check` | Lint + typecheck + coverage + build |

## When to write E2E

**Default: do not add E2E.** Use the lowest-cost test layer that can detect the failure. E2E is a small, deliberate set of stable browser journeys, **not** one spec per feature, form, route, or bug. Changes without a qualifying journey need no new Playwright test.

Choose E2E only when **all** of these are true:

1. **High impact:** a regression would block an essential user journey, expose protected data, cause material data loss, or incorrectly commit a consequential/irreversible action.
2. **Cross-layer risk:** correctness depends on the real browser connecting multiple boundaries (e.g. router + cookies/storage + auth refresh + network handling + query cache). Unit/component/integration tests cannot adequately exercise the specific failure mode.
3. **Worth maintaining:** a deterministic, representative scenario can assert an observable outcome without a live third-party dependency, brittle timing, or duplicating existing E2E coverage.

**Prioritize representative E2E journeys when the product implements them:**

| Journey | What a browser test should prove |
| --- | --- |
| Authentication/session lifecycle | Login, enter a protected route, survive browser reload, handle an expired token with refresh/retry, then logout; protected content stays inaccessible after logout, including direct navigation/back/reload. Split into a few focused scenarios if clearer; do not exhaustively combine all states. |
| Authorization boundary | Direct links to protected routes and role/permission changes cannot show private data or invoke private queries. Verify the highest-risk boundary, not every route. |
| Consequential multi-step submission | A critical payment, irreversible action, or data-loss-sensitive workflow persists/commits exactly the intended result across navigation and network handling. Only applicable if the project has that domain feature. |
| Stateful multi-route integration | A scoped provider or session/query cache must survive the correct child navigation and reset when its scope ends; add E2E only if browser routing/lifecycle is the actual regression risk. |
| Escaped critical regression | An incident escaped lower-layer tests because the failure required browser-level integration; preserve one focused reproduction and keep detailed edge cases in cheaper tests. |

**Usually NOT E2E:** input validation and error copy, simple forms, a new link/route, table/filter/sort, modal/toast, responsive variations, theme switch, loading/empty states, pure calculations, hooks and API mapping. Cover these with Vitest, React Testing Library, MSW-backed component/integration tests, or targeted accessibility checks. Do **not** multiply E2E across viewport/theme/role combinations without distinct, demonstrated risk.

**Auth example:** a small Playwright suite might cover (a) login + protected route + reload, (b) token expiry + successful/failed refresh + request handling, and (c) logout + private-state/cache cleanup + blocked direct revisit. Detailed validation errors, token policy, retry/backoff and each backend response belong in unit/integration/API tests. Browser tests with mocked auth endpoints **do not** prove the real auth backend or token rotation; validate that contract separately in its own integration environment.

**Accessibility / visual testing:** keep a compact set of representative axe/keyboard scenarios; use RTL for routine component accessibility. Screenshot regression is a separate, opt-in protection for design-critical, stable screens; a cosmetic change is not an instruction to add screenshots. Existing starter demo tests are examples, not a template to duplicate for every product feature.

**When reviewing a change:** mention briefly which risk was tested and at what layer. If no E2E was added, no special justification is needed unless the change introduces one of the critical journeys above. If E2E is added, state the cross-layer failure it uniquely detects and avoid duplicate cases. CI still runs the existing small Playwright suite on PRs; this policy limits **growth** of the suite rather than weakening existing gates.

## MSW (Mock Service Worker)

`src/test/mocks/handlers.ts` defines a harmless GET fixture at
`https://example.test/api/health`. `src/test/mocks/server.ts` wires MSW for Node
and `src/test/setup.ts` starts it automatically for all Vitest tests, resetting
per-test overrides afterwards. Unhandled network requests are treated as errors.

Use `server.use(http.get(...))` inside the current test when customizing a response.
Do not use production secrets or a live backend to test UI. A feature can keep its
mock handlers within its own folder and share them with `src/test/mocks/handlers.ts`.

## Coverage

The initial thresholds enforced against **shared components, shared utilities and
the theme provider** are:

- Statements 75%; branches 65%; functions 75%; lines 75%.

The scope is deliberately explicit (`vite.config.ts`) so newly created feature code
is not counted as "covered" without tests. Add features to the include list or
configure stricter feature-specific thresholds as the codebase grows. Coverage
report: `coverage/index.html` after running `pnpm run test:coverage`.

## Accessibility

`e2e/accessibility.spec.ts` checks WCAG 2.0/2.1 A+AA structural rules with axe,
and verifies the dialog can be operated and dismissed with a keyboard and restores
focus. **The color-contrast axe rule is temporarily disabled**: colors inherited
from the LifeAI theme (e.g. light primary/success/danger text on white) may not
meet WCAG AA contrast ratios. This exception preserves the requested visual design
and should be removed only after design review and color-token remediation.

Use `pnpm run test:a11y` to reproduce the currently enforced checks. This does **not**
constitute a complete WCAG compliance certification. Preserve accessible names,
focus indication, keyboard operation and semantic controls when adding features.

## Visual regression

`e2e/visual.spec.ts` captures full-page screenshots of light Home and light/dark
UI kit, using a fixed Chromium viewport, reduced motion and disabled animations.

**Baseline bootstrap (one-time):** On Linux with Node 22 and Chromium installed:

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm run test:visual:update
# Review PNGs under e2e/visual.spec.ts-snapshots/ and commit them.
pnpm run test:visual
```

Screenshots generated on macOS or Windows may differ from Linux CI because of font
rendering. Prefer generating and updating baselines on Linux using the same Chromium
version as CI. Avoid updating a snapshot without reviewing the UI diff.

**Important:** Reviewed PNG baseline files are not bundled. To avoid false green approvals,
`pnpm run test:visual` requires baselines and will fail without them. The regular
`pnpm run test:e2e` excludes `@visual` tests. In GitHub Actions the visual job starts
running automatically once baseline PNGs are committed; until then, visual checks
are not enforced in CI. This is an explicit remaining setup step, not a passed test.

## Test conventions

1. Keep `*.test.ts(x)` near the unit/component under test; reserve `e2e/` for the **qualified critical journeys** above.
2. Test behavior from the user's perspective (`getByRole`, visible text), not private state.
3. Check accessibility for interactive elements: names, focus, keyboard and error states.
4. Mock HTTP with MSW; never make assertions based on live external API availability.
5. Reset mocks, timers, localStorage and document mutations between tests when necessary.
6. Add regression coverage for meaningful bug fixes and new shared UI primitives at the **lowest sufficient layer**; don't automatically turn each regression into E2E.
7. Keep screenshot baselines reviewed and versioned; don't auto-approve visual diffs.
8. The CI gate rejects lint warnings, TS errors, failing tests, coverage regressions and existing E2E failures; it does not require new E2E for every change.

## CI

`.github/workflows/ci.yml` runs lint, typecheck, coverage, build, Chromium E2E
(including structural accessibility) on push to main and every pull request.
Visual snapshots run if snapshot PNGs have been committed. Installs use `pnpm-lock.yaml` with
`pnpm install --frozen-lockfile`; update the lockfile with `pnpm install` when changing dependencies.
