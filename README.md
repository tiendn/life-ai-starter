# LifeAI FE Starter

A clean React frontend foundation extracted from the supplied `life-vesting` codebase.
It preserves architecture and LifeAI's visual design language **without** any
Vesting/Grants business logic, blockchain connections, wallet adapters or data.

## Run

Use Node.js 22 LTS and pnpm 12.4.1 (pinned in `package.json`).

```bash
pnpm install --frozen-lockfile
pnpm run dev
```

**Quality check:** `pnpm run check` runs ESLint, TypeScript, Vitest coverage gates
and the production build. For browser checks, run `pnpm exec playwright install chromium`
and `pnpm run test:e2e`. See [Testing and quality](docs/TESTING.md) for MSW,
accessibility, snapshot bootstrapping and CI expectations.

## AI coding agents

[`AGENTS.md`](AGENTS.md) defines repository conventions and links to the architecture,
API, design and testing guidance. Keep implementation details in those documents.

`pnpm run feature:scaffold user-profile --dry-run` previews a small feature scaffold;
omit `--dry-run` to generate it. The generator refuses to overwrite existing files
and does not register routes or create API integrations.

## Stack

React 18 · TypeScript · Vite 5 · TanStack Router · TanStack Query · Tailwind CSS 3
· Framer Motion · Lucide · ESLint 9 · Vitest + Testing Library · MSW · Playwright
· axe-core.

## Structure

```text
src/
  app/           AppProviders, AppShell, router
  core/          empty: new integrations/adapters belong here
  features/      empty: new features belong here
  pages/         HomePage, UIKitPage, NotFoundPage
  shared/        business-agnostic UI components, motion, utils
  test/          Vitest setup and example MSW mocks
  theme/         source tokens, generated CSS, light/dark provider
scripts/         theme generator
e2e/             interaction, accessibility and visual regression tests
docs/            architecture, design system, development, testing
```

## What stays

- Original light/dark brand palette, typography, radius, shadows and theme generator.
- Original header behavior, responsive navigation and page transition language.
- General-purpose `Button`, `Surface`, `Dialog`, `SectionLabel`, `AnimatedProgress`,
  `MotionPage`, `BrandLogo`; plus `Input`, `Badge` and `EmptyState` primitives.
- Modular layering (`app` / `core` / `features` / `pages` / `shared` / `theme`).

## What was removed

- Vesting, grants, on-chain flows, smart-contract ABIs, and product-specific pages.
- Wagmi, viem, RainbowKit, wallet/network/transaction UI and on-chain configuration.
- The original `.git`, `.env*` values, builds, old screenshots, product-specific tests.

`/` is a neutral starter home. `/ui-kit` previews design components and is
not connected to real data. Both are safe to replace for a new product.

## Quality gates

- ESLint for TypeScript, React Hooks, accessibility and Fast Refresh.
- Vitest component tests and example MSW handlers.
- V8 coverage thresholds for shared UI/theme code.
- Playwright interaction/keyboard tests and structural axe WCAG scans.
- Visual regression tests that compare against **reviewed** screenshot PNG baselines.
- GitHub Actions checks on push/PR.

**Remaining setup:** Visual screenshot baselines must be generated, reviewed and
committed before the visual CI gate becomes active; original palette contrast
needs a separate accessibility review.

See [ARCHITECTURE](docs/ARCHITECTURE.md), [DESIGN_SYSTEM](docs/DESIGN_SYSTEM.md),
[DEVELOPMENT](docs/DEVELOPMENT.md), [TESTING](docs/TESTING.md) and
[UX_MOTION](docs/UX_MOTION.md).
