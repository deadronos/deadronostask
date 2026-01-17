# Requirements (EARS-style) — Core MVP (backfilled)

This document captures concise, testable requirements derived from `spec.md` and recent implementation work (TASK002). Each requirement includes an acceptance test and links to where it is implemented or tested in the repo.

## High-priority requirements

1. WHEN an authenticated user opens the app, THE SYSTEM SHALL ensure a Convex `users` row exists for that Clerk identity.
   - Acceptance: `api.users.upsertMe()` creates/updates row; verified by `tests/convex/users.test.ts` or UI path that calls `upsertMe` on sign-in.
   - Implemented: `src/convex/users.ts`, exercised in `src/app/(app)/dashboard/page.tsx` (upsertMe) and Convex unit tests.

2. WHEN a user creates a project, THE SYSTEM SHALL persist it with ownership and sensible defaults.
   - Acceptance: `projects.create({ name })` returns an id; DB row has `ownerClerkUserId`, `archived: false`, timestamps set.
   - Implemented: `src/convex/projects.ts` + `tests/convex/projects.test.ts` (create/list/archive/update).

3. WHEN a user creates a task, THE SYSTEM SHALL validate and persist required fields, assign ordering, and enforce ownership.
   - Acceptance: `tasks.create()` validates `title`, sets `order` (incremental), `status: 'todo'`, and rejects invalid `projectId`.
   - Implemented: `src/convex/tasks.ts` + `tests/convex/tasks.test.ts`.

4. WHEN a user requests `/projects`, THE SYSTEM SHALL render a server-side index of projects for that user (non-archived by default).
   - Acceptance: Server page renders 200 and `main` contains project cards when user has projects.
   - Implemented: `src/app/(app)/projects/page.tsx` (UI) — E2E coverage planned in `TASK003`.

5. WHEN a user interacts with Create Project / Create Task dialogs, THE SYSTEM SHALL provide accessible forms with labels and client-side guarding and show succinct errors for invalid input.
   - Acceptance: Dialogs contain `DialogTitle`/`DialogDescription`, labelled inputs, and submit disabled when required fields are empty (verified with Playwright).
   - Implemented: `src/components/CreateProjectButton.tsx`, `src/components/CreateTaskButton.tsx` — E2E tests pending (TASK003).

## Secondary requirements (non-blocking)

- Filtering & search: `tasks.list` supports `projectId`, `status`, and `search` parameters and returns correctly filtered and ordered results (covered in unit tests).
- Authorization: All Convex mutations/queries must call `requireUserId()` and reject unauthorized calls (Convex tests cover these checks).
- tRPC: service procedures must be `protectedProcedure` for user-data-affecting endpoints and have unit tests (some procedures are currently placeholders; tracked in TASK004).

## Acceptance-test mapping (quick)

- Unit tests (Convex): `tests/convex/*.test.ts` — cover data validation, ownership, and indexing.
- Integration tests (Vitest/next): `tests/integration/*` — scaffold present but many `it.todo` remain (expand next).
- E2E (Playwright): `tests/playwright` / `tests/e2e` — must cover create/list/navigate/create-task flows (TASK003).

## Recommended enforcement

- Block release on: missing Playwright coverage for create→list→navigate→create-task (core happy path).
- Require Decision Record for any deviation from owning-only data model (e.g., shared projects).

---

(Backfilled 2026-01-17 by repo audit)
