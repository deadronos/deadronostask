# DECISION001 - Modernize UI: component-first approach

**Status:** Recorded
**Decision date:** 2026-01-16
**Decision owner:** frontend lead (recorded)

## Summary

We chose a component-driven modernization (shadcn-inspired primitives + semantic tokens) rather than incremental utility-only updates. This decision standardizes the visual vocabulary, improves accessibility, and reduces future CSS drift at the cost of a short-term refactor effort across pages.

## Alternatives considered

- Continue with utility-only ad-hoc updates (rejected): faster short-term but increases UI drift and inconsistent affordances.
- Introduce a third-party design system (rejected): heavyweight and not aligned to the project's small-surface-area needs.

## Consequences

- Positive: consistent components (`Card`, `Dialog`, `Input`, etc.), easier visual regression coverage, improved accessibility.
- Negative: upfront work to convert existing markup; some small visual regressions required manual QA.
- Deferred: visual-regression automation (recommended follow-up, low priority but valuable).

## Files changed (representative)

- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/projects/page.tsx`
- `src/components/TaskItem.tsx`
- `src/components/CreateTaskButton.tsx`

## Rationale

The app's surface area is small and the team benefits more from a lightweight, consistent component layer than from incremental utility fixes. Accessibility improvements (visible labels, dialog semantics, role-based structure) were prioritized because they materially improve testability and ARIA snapshot coverage.

## Follow-ups

- Add Playwright `toMatchAriaSnapshot` checks for the `main` regions and dialogs (TASK003).
- Consider visual regression CI job (low priority).

---

Recorded to preserve trade-offs and to help reviewers and future maintainers understand why the refactor occurred.
