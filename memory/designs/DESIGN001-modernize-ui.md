# DESIGN001 - Modernize TaskFlow UI

**Status:** Completed
**Added:** 2026-01-16
**Updated:** 2026-01-16

## Summary

This design documents the visual modernization of TaskFlow's core UI: landing page, dashboard, projects index, project detail (kanban), task items, and creation dialogs. The goal was to move from utility-only markup to a cohesive component-driven system (shadcn-inspired components) with semantic tokens, improved spacing, and better accessibility.

## Requirements (EARS)

- WHEN a new or returning user visits the site, THE SYSTEM SHALL present a landing page with a clear value proposition and CTAs (Acceptance: manual verification of landing hero, buttons visible at 1280px and 375px).
- WHEN a signed-in user navigates to the dashboard, THE SYSTEM SHALL show quick stats (active projects, tasks, completed) in card components (Acceptance: counts reflect seeded data and use `Card` components).
- WHEN a user navigates to `/projects`, THE SYSTEM SHALL render an index of projects so navigation links do not 404 (Acceptance: request to `/projects` returns 200 and list contains project cards).
- WHEN a user opens the Create Task action, THE SYSTEM SHALL show an accessible modal dialog with proper header, description, labeled inputs, and form validation (Acceptance: `DialogTitle` and `DialogDescription` present; submit disabled when title empty).

## Design Notes

- Components: `Card`, `Badge`, `Button`, `Dialog`, `Input`, `Select`, `Label`, `TaskItem` (enhanced), `CreateTaskButton`, `CreateProjectButton`.
- Visual tokens: use semantic tokens like `bg-background`, `text-muted-foreground`, `bg-card`, `primary` for accents.
- Accessibility: Dialogs include `DialogTitle` and `DialogDescription`. Buttons and inputs have labels or `aria-label` where necessary.
- Interactions: subtle elevation on hover, group hover to reveal secondary actions (e.g., Archive button), loading states for create actions.

## Data Flow & Pages

- Landing page: server component, redirects signed-in users to `/dashboard`.
- Projects index: fetches projects subscribed via Convex query; uses `Card` layout with project counts and links.
- Project detail: server component fetches project and tasks; UI renders three columns (To Do, In Progress, Done) with `TaskItem`.

## Acceptance Tests (manual & automated suggestions)

- Manual: Visual comparison of `Before` vs `After` using `VISUAL_COMPARISON.md` as a checklist.
- Automated: Add Playwright tests verifying the `/projects` page renders and the Create Task dialog opens and validates required fields.

## Implementation Artifacts

- Visual reference: `VISUAL_COMPARISON.md` (in repo root) contains before/after snippets used to guide the refactor.
- PR: `Modernize UI and add Projects index` (see PR #18 on GitHub) — includes most visual changes and the new `/projects` route.

## Follow-ups

- Add Playwright tests for `/projects` (see TASK003).
- Add visual regression checks (optional) for critical components.

---

_Design authored and recorded to ensure the work is discoverable and reproducible._
