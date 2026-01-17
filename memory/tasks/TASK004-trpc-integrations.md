# TASK004 - Implement tRPC integrations & add unit tests

**Status:** Pending
**Added:** 2026-01-17

## Goal

- Replace placeholder tRPC procedures with production-ready implementations or mark them explicitly experimental. Add unit tests that verify authorization and correct calls into Convex where applicable.

## Original request / context

The repo scaffolds several tRPC procedures (`integrations.github.importIssues`, `tasks.batchArchive`, `projects.seedDefaults`) but the implementations are placeholders. These can be useful for service-plane operations (bulk/archive/import) and should be either implemented or clearly documented as experimental.

## Requirements (EARS)

- WHEN a client calls `tasks.batchArchive`, THE SYSTEM SHALL archive each task the caller owns and return a count of archived items (Acceptance: unit test that seeds tasks, calls procedure, and asserts DB state and return value).
- WHEN a user invokes `integrations.github.importIssues`, THE SYSTEM SHALL validate repo input, create tasks in the specified project, and return a per-item result summary (Acceptance: unit test for input validation + mocked GitHub response).
- All tRPC procedures that mutate user data SHALL be `protectedProcedure` and have unit tests for auth failure cases.

## Implementation plan (TDD)

- Red: add failing unit tests for `tasks.batchArchive` and `integrations.github.importIssues` covering happy & unauthorized paths.
- Green: implement minimal Convex-backed behavior and input validation; mock external API calls in tests.
- Refactor: add end-to-end integration test or an integration-style Vitest that verifies the flow when Convex and tRPC are wired together.

## Acceptance criteria

- Unit tests exist and pass for each implemented procedure (happy + unauthorized + invalid input).
- Procedures are exported in `src/server/trpc/router.ts` and documented in-code.
- If functionality is intentionally deferred, a short Decision Record must be added and procedure must return a clear `notImplemented`/`experimental` message rather than silently succeed.

## Subtasks & estimates

- Add unit tests for `tasks.batchArchive` (0.5d)
- Implement `tasks.batchArchive` → call Convex mutation(s) + tests (0.5d)
- Add unit tests & implement `projects.seedDefaults` OR mark experimental (0.5d)
- Add tests/mocks for `integrations.github.importIssues` (0.75d)
- CI: add tests run on `node:test` job (0.25d)

---

Primary owner: backend engineer (suggested)
