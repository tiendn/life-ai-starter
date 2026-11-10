---
name: page-ux
description: Design or improve a responsive LifeAI frontend page, screen, dashboard or multi-section UX while preserving the existing UI theme. Use for information hierarchy, layout, loading/empty/error states, responsive behavior and motion; not for changing the global design tokens.
---

# Compose a coherent page

Read [Design System](../../../docs/DESIGN_SYSTEM.md), [UX & Motion](../../../docs/UX_MOTION.md) and `src/pages/HomePage.tsx` / `UIKitPage.tsx`.

## Sequence

1. Identify the user's top question and **one primary action**. Decide which information must be visible above the fold. Avoid presenting equal-weight cards for every item.
2. Sketch the content hierarchy in plain text: heading → key outcome/action → supporting sections → optional details. Resist redundant UI copy and decorative data. Before detailed JSX, map meaningful feature blocks and existing primitives using [component composition](../../../docs/ARCHITECTURE.md#component-composition). Keep the page focused on route orchestration and layout rather than detailed feature interactions.
3. Build mobile-first. Page gutters are approximately 20px mobile, 40px tablet, 64px desktop; content max about 1440px. Start with one column and progressively enhance. Test 320px/375px widths and 1280px+.
4. Compose with reusable `Surface`, `SectionLabel`, `Button`, `Badge`, `EmptyState`, `MotionPage`; use semantic tokens, typography roles and the existing rounded shapes. Prefer CSS layout over absolute positioning for core content.
5. Include real loading, empty, error, success and partial-data states where needed. Don't fabricate product numbers or production API responses. Keep data integrations isolated behind feature hooks.
6. Validate navigation, affordance, focus and tab order. Main content should have a heading. Check layout with long labels, truncation, touch targets ≥44px and proper status announcements.
7. Review animation. Use `MotionPage` and respect `prefers-reduced-motion`; animation should explain transitions, not delay interaction.
8. Update `e2e/visual.spec.ts` only for stable, meaningful pages; review snapshots on consistent Linux Chromium. Recheck accessibility and both themes.

## Decision filters

- Can the page work with no data?
- Is the primary action obvious within 5 seconds?
- Are details revealed progressively instead of all at once?
- Can all critical controls be used without a pointer?
- Does dark mode preserve hierarchy and contrast? Note: brand tokens currently have known unverified contrast; do not assert WCAG compliance without checking.

## Output

Implemented page, short UX rationale, responsive/keyboard checks, and visual diff status.

## Feedback decisions

When a page needs notifications or operation feedback, apply
[System feedback](../../../docs/FEEDBACK.md): choose inline, toast or banner by
purpose and lifetime. Let the feature determine confirmed versus unknown outcomes
and safe recovery. Do not turn polling errors into repeated toasts.
