---
name: accessibility-audit
description: Audit or improve keyboard, screen-reader, focus, semantic markup, touch-target and WCAG accessibility of LifeAI frontend pages/components. Use for a11y requests or complex interactive UI; verify contrast separately because the existing axe suite disables that rule.
---

# Accessibility audit and remediation

Read [UX & Motion](../../../docs/UX_MOTION.md), [Testing](../../../docs/TESTING.md), and inspect `e2e/accessibility.spec.ts`.

## Audit steps

1. Map the user journey: tab sequence, enter/space activation, Escape, return focus, skip links/landmarks, heading hierarchy and error recovery. Prefer native semantics over custom ARIA.
2. Inspect accessible names: icon-only buttons, form labels, landmarks, status messages and input descriptions. Do not use placeholder as a label.
3. Check dialog behavior (focus entry, containment, Escape and focus return). The starter `Dialog` needs production-level focus trapping assessed rather than assumed.
4. Check 320px/mobile reflow, 44px touch targets, no horizontal overflow, 200% zoom and reduced motion. Ensure focus remains visible in both themes.
5. Measure contrast on *rendered* text/icon/border backgrounds, including hover and disabled states. The preserved palette contains possible AA failures and the existing axe test **disables** the color-contrast rule; document this gap explicitly.
6. Fix highest-impact violations without silently replacing brand colors. If a design trade-off requires palette changes, propose token-level changes for approval.
7. Add a11y regression tests using roles, keyboard interactions and `@axe-core/playwright`, plus any manual screen reader checks performed.

## Reporting format

| Issue | Impact | Reproduction | Fix | Verified? |
| --- | --- | --- | --- | --- |
| Example | Keyboard can't reach primary action | Tab from page heading | Use native button with visible focus | State actual check |

Separate **automated results** from **manual checks**. Avoid calling the whole product WCAG compliant on the basis of a single suite.
