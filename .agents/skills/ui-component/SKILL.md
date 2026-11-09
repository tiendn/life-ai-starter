---
name: ui-component
description: Create, extend or refactor a reusable React UI component in the LifeAI design system. Use for buttons, inputs, dialogs, badges, forms and shared interactive primitives; prioritize semantics, typed APIs, theme tokens and component tests. Not for feature-specific page layout.
---

# Build a shared UI component

[Component review checklist](references/component-review.md) provides a focused acceptance matrix.

## Before touching code

Read [Design System](../../../docs/DESIGN_SYSTEM.md), [UX & Motion](../../../docs/UX_MOTION.md), and inspect `src/shared/components/` plus `/ui-kit`. Reuse existing components first. If the view encodes business meaning, keep it under its feature instead of `shared`.

## Implementation recipe

1. Specify **one job** and a small public API. Prefer native HTML semantics and `ComponentPropsWithoutRef<'button'>` / appropriate native element props where useful.
2. Support `className`, disabled/required states where meaningful, forwarded refs only when needed, and transparent event handling. Keep variant styling centralized (see `buttonClassName.ts`).
3. Use semantic classes `bg-app-surface`, `text-app-text`, `border-app-border`, `focus-visible:ring-app-action`; do not add hardcoded brand hex colors. The palette is controlled by `src/theme/_config.ts`.
4. Use a real `<button>` for actions and `<a>` / router `<Link>` for navigation. Every icon-only action needs a name. Keyboard focus and visible focus style are non-optional.
5. For overlays, check Escape, focus return and focus trapping. **Existing `Dialog` is not a full production-grade modal primitive**; do not represent it as one without verifying and addressing focus containment.
6. Support dark theme, reduced motion, long localized text, responsive widths, and empty/error states when applicable. Avoid animations that obscure information.
7. Add `Component.test.tsx` with Testing Library and `userEvent`; assert roles, labels, state transitions and keyboard behavior, not CSS internals. Update `src/pages/UIKitPage.tsx` when the new component merits a showcase.

## Acceptance checks

- Does an existing primitive already solve this?
- Can a screen reader name the control and understand state?
- Can it be used with keyboard and without motion?
- Does it preserve both themes at 320px and desktop?
- Do `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:run` and related E2E/a11y checks pass?

## Deliverable

A focused component API, real behavior tests, and (when warranted) a UI-kit example. Do not install a new component library without a demonstrated need.
