# Reusable component checklist

Review only the checks relevant to the primitive; don't blindly copy all props into every component.

- Semantic HTML matches the role: action `<button>`, navigation `<a>` / `Link`, form `<label>` and input.
- Component name and props say what it does; no untyped `any`, accidental global state or unrelated business logic.
- Existing `src/shared/components` alternatives were reviewed before creating a new one.
- It works without JavaScript-only hover, supports keyboard activation and exposes a visible focus ring.
- Accessible name is present for every control; errors/helper text are associated correctly.
- Light/dark backgrounds, text and borders use semantic tokens; visual states are distinguishable without color alone.
- Relevant states: disabled, focus, hover, error, loading, empty, active and reduced motion.
- Touch target size, long content, 320px viewport and 200% browser zoom considered.
- Dialog/popover: focus trapping, Escape, return focus and screen-reader role are explicitly verified.
- Real tests cover observable behavior, including keyboard interactions; UI kit updated only when useful.
- Extraction owns a meaningful responsibility or design-system contract; shared placement has concrete justification.
- Repeated state UI is consolidated where behavior matches; simple semantic HTML and unrelated states are not forced into generic wrappers.
