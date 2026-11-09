---
name: frontend-performance
description: Profile and improve slow React components, route transitions, client bundle size, excessive re-renders or network waterfalls in LifeAI FE Starter. Use for performance tasks with observed symptoms; measure first and preserve correctness, accessibility and visual design.
---

# Optimize evidence-first

Read [Architecture](../../../docs/ARCHITECTURE.md), [Vercel React performance guidance](https://vercel.com/blog/introducing-react-best-practices), and [React Effects guidance](https://react.dev/learn/you-might-not-need-an-effect).

## Workflow

1. Define the symptom (slow LCP, interaction delay, bundle load, re-render, API waterfall) and capture a baseline when a browser is available. Document device/network conditions.
2. Find the actual bottleneck before memoizing code. Inspect bundle composition, route boundaries, React Profiler traces and DevTools network waterfall where applicable.
3. Remove sequential requests that can run independently; avoid duplicate fetches and cache server state via TanStack Query with correct keys and stale settings.
4. Prefer derived state during render over effect-driven synchronization. Avoid costly computations on every keystroke; memoize only when profiling or clear complexity justifies it.
5. Reduce large imports and expensive eager routes where measurements show benefit. Preserve type-safe routing and correct error/loading behavior.
6. Keep accessibility and reduced-motion semantics; do not disable animation wholesale unless necessary for user experience.
7. Rerun the same measurement and relevant tests. State before/after values only when actually captured.

## Guardrails

- This is Vite + React Router stack, **not Next.js**. Do not apply Next-specific server-component, hydration or cache directives.
- No guessed performance percentages, fabricated metrics or cargo-cult `useMemo`.
- No changes to design tokens as a “performance fix” unless requested.

## Output

Problem, evidence, exact change, observed effect, trade-offs and tests run.
