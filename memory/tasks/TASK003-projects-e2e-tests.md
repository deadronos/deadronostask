# TASK003 - Add Playwright tests for Projects index and project flows

**Status:** In Progress
**Added:** 2026-01-16
**Updated:** 2026-01-17

## Goal

- Add reliable Playwright E2E tests covering `/projects` index, project navigation, and Create Project/Task flows. Unskip or replace existing skeletons in `tests/e2e` and ensure scenarios run deterministically in CI.

## Requirements (EARS)

- WHEN a user visits `/projects`, THE SYSTEM SHALL display a list of projects (Acceptance: Playwright verifies a `main` region with project cards and asserts at least one project is visible when seeded test data exists).
- WHEN a user opens a project from the index, THE SYSTEM SHALL navigate to the project detail page (Acceptance: `toHaveURL` checks path contains `/projects/<projectId>` and the project title is visible).
- WHEN a user creates a task using the Create Task dialog, THE SYSTEM SHALL show the new task in the appropriate column (Acceptance: dialog opens, form can be filled, and new task appears in the `To Do` column).

## Subtasks (TDD + CI)

1. (Red) Add failing Playwright test: `projects-e2e - should render projects index with project cards` — assert `main` -> project card count. (Est: 0.5d)
2. (Green) Seed deterministic test data using Convex test helper or API seed endpoint and make test pass. (Est: 0.5d)
3. (Red) Add failing test: `projects-e2e - can open project and create task` — open dialog, fill, submit, assert task appears. (Est: 0.5d)
4. (Green) Implement any test-only helpers or fixtures and stabilize flakiness. (Est: 0.5d)
5. (Refactor) Consolidate setup into `test.beforeEach`, add `toMatchAriaSnapshot` checks for `main` regions and dialog. (Est: 0.5d)
6. (CI) Add/enable job `playwright:e2e:projects` in CI and run on PRs. (Est: 0.25d)

## Acceptance Criteria

- Playwright scenarios added to `tests/playwright/projects.spec.ts` (or `tests/e2e/projects.spec.ts`) and **not skipped**.
- CI runs the `playwright:e2e:projects` job on PRs and the job is green.
- Tests use role-based selectors and include an ARIA snapshot for `main` on index and project detail.

## Implementation notes

- Prefer `test.step()` for grouping actions and `getByRole` locators for resiliency.
- Use Convex test helpers to seed and tear down data instead of relying on UI-only setup where possible.
- If seeding via API, add a test-only tRPC route guarded by NODE_ENV=test.

## PR checklist

- [ ] Title: `E2E: projects — add Playwright scenarios for index & create flow`
- [ ] Link to failing test(s) and explanation of why they failed initially
- [ ] CI job green on first green run
- [ ] Add a short troubleshooting note if any flakiness was addressed

---

Primary owner: frontend engineer (suggested)
