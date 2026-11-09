---
name: bugfix-review
description: Diagnose and repair frontend bugs or review a pull request/diff for correctness, regressions, TypeScript, lint, security, architecture and LifeAI design-system consistency. Use for failures, broken interactions, code review or focused refactoring; prioritize reproducible evidence and actionable findings.
---

# Debug and review with evidence

Read repository `AGENTS.md`, [Architecture](../../../docs/ARCHITECTURE.md), [Testing](../../../docs/TESTING.md) and the exact changed files.

Use the [review report template](references/review-report.md) to document findings and verification.

## For a bug fix

1. Reproduce from a described action, failing test, console error or trace. Record expected versus observed behavior. Don't invent a reproduction.
2. Trace the smallest relevant path: route → page → feature → shared/core. Distinguish data/state bugs from UI and test environment problems.
3. Add a failing regression test when feasible; if not, record a repeatable manual scenario.
4. Fix the root cause with minimal changes. Avoid unrelated dependency upgrades, restyles, type assertions or lint suppression.
5. Rerun the failing test, neighboring tests and available quality gates. Check both themes/mobile for UI regressions.

## For a code review

Prioritize findings by **severity and proof**:

1. Correctness and user-visible regressions, including state races, empty/error paths and data mismatches.
2. Security/privacy: leaked secrets, untrusted URL/data use, auth assumptions, API boundary mistakes.
3. Architecture: forbidden feature-to-feature imports, global state proliferation, duplicated primitives.
4. A11y/UX: inaccessible controls, focus loss, motion problems, theme regressions.
5. Tests, lint, type safety and performance risks supported by evidence.

Report each concrete finding as: **severity → file/line → scenario → impact → suggested correction**. Distinguish blockers from observations; if no findings, state remaining untested surfaces rather than guaranteeing quality.

## Final handoff

Summary of root cause or review outcome, files changed (if any), executed commands/results, and remaining risks. Never claim unrun checks passed.
