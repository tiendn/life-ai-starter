# Test coverage matrix

| Change | Vitest / Testing Library | MSW | Playwright | Visual | Manual |
| --- | --- | --- | --- | --- | --- |
| Pure utility | Required for edge cases | — | — | — | — |
| Branded shared component | Interactions and semantics | — | Only if critical flow | If layout is stable | Keyboard, both themes |
| Data-driven feature | Render states | Success/empty/error | Main user action | Optional | Error recovery |
| Router/header | Optional | — | Direct load, back, mobile | Optional | Keyboard nav |
| Modal/form | Semantics, validation | When needed | Focus + submit + Escape | If stable | Keyboard, screen reader |
| Token changes | Affected components | — | A11y | Light/dark baseline | Contrast, zoom |

**Policies:** Browser tests use deterministic test data and user-facing locators; do not snapshot incidental third-party content. Contrast must be independently assessed because the current automated axe suite excludes it. A PNG baseline is an approved artifact, never a shortcut for green CI.
