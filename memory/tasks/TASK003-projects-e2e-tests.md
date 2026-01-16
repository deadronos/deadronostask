# TASK003 - Add Playwright tests for Projects index and project flows

**Status:** Pending
**Added:** 2026-01-16

## Goal

- Add reliable Playwright E2E tests covering `/projects` index, project navigation, and Create Project/Task flows. Unskip existing `tests/e2e/projects.spec.ts` and add robust steps validating the UI changes from DESIGN001.

## Requirements (EARS)

- WHEN a user visits `/projects`, THE SYSTEM SHALL display a list of projects (Acceptance: Playwright verifies a `main` region with project cards and asserts at least one project is visible when seeded data exists).
- WHEN a user opens a project from the index, THE SYSTEM SHALL navigate to the project detail page (Acceptance: `toHaveURL` checks the path contains `/projects/<projectId>` and the project title is visible).
- WHEN a user creates a task using the Create Task dialog, THE SYSTEM SHALL show the new task in the appropriate column (Acceptance: dialog opens, form can be filled, and new task appears in `To Do` column).

## Implementation Plan (TDD)

- Red: Add failing Playwright test that navigates to `/projects` and expects a project card to be present.
- Green: Implement test seed or use existing seeded test account to make the assertion pass.
- Refactor: Consolidate setup steps into `test.beforeEach` and add accessibility/aria checks for dialog.

## Acceptance Criteria

- Playwright tests in `tests/e2e/projects.spec.ts` are enabled (not skipped) and pass in CI.
- Tests use role-based accessors (`getByRole`, `getByText`) and assert `toMatchAriaSnapshot` for at least the index and project detail `main` region.

## Notes

- See skipped tests in `tests/e2e/projects.spec.ts` for inspiration and to avoid duplication.
- Consider adding a `toMatchAriaSnapshot` check for `Create Task` dialog content.
