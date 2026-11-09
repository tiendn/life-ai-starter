---
name: design-tokens
description: Modify, audit or extend LifeAI theme tokens, typography, color modes, spacing semantics or visual component styling. Use when the user explicitly asks for design-system or theme changes and when a token is missing; do not alter brand colors merely to satisfy unrelated feature requests.
---

# Maintain the LifeAI theme

## Source path

`src/theme/_config.ts` → `scripts/generate-theme.ts` → `src/theme/generated/tokens.css` → `tailwind.config.ts` → components. See [Design System](../../../docs/DESIGN_SYSTEM.md).

## Safe workflow

1. Inspect existing semantic aliases before adding one. Prefer `app-text`, `app-muted`, `app-action`, `app-surface`, `app-border` and their Tailwind utilities.
2. Classify the requested change: **brand palette**, **semantic color mapping**, **typography**, **radius/shadow**, **motion** or **component-level styling**. Modify the smallest appropriate layer.
3. If editing tokens, update only `src/theme/_config.ts` and generator logic if needed, **never** the generated CSS directly. Run `pnpm run theme:generate`.
4. Keep light and dark variants paired and check interactive states (hover, focus, disabled, error). Do not assume a light-mode fix also works in dark.
5. Inspect the actual contrast ratios for text/icons and focus indicators against their rendered backgrounds. Some inherited brand combinations may not pass WCAG AA; preserve the brand unless explicitly asked, but document failures and remediation options.
6. Check `/ui-kit` for visual consistency and run screenshot tests only against reviewed baselines; do not blindly regenerate to silence failures.
7. Update [Design System](../../../docs/DESIGN_SYSTEM.md) and any affected component tests. Run `pnpm run check` and a11y/visual checks where possible.

## Forbidden shortcuts

- Scattering literal hex values throughout TSX.
- Inventing duplicate color names for an existing semantic purpose.
- Making an accessibility claim based on axe tests alone (contrast checks are currently disabled in existing E2E configuration).
- Silently redesigning the LifeAI identity during unrelated feature work.

## Handoff

State exactly which token changed, affected light/dark semantics, any contrast risk, and evidence from tests/screenshots.
