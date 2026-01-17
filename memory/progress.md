# Progress

## Status

- Memory bank populated for recent UI & backend work.
- Convex unit tests cover tasks/projects behavior; schema updated for nullable `dueAt`.

## Known Issues

- Playwright E2E coverage for core project/task flows is missing (several `it.todo` entries remain in `tests/integration` and `tests/e2e`).
- tRPC procedures in `src/server/trpc/router.ts` are scaffolded/placeholders and need implementation or an explicit experimental flag (see TASK004).
- CI currently does not run Playwright scenarios that exercise the new `/projects` UI (add job `playwright:e2e:projects`).

## Recent Activity

### 2026-01-16

- Completed UI modernization and added the Projects index route (see `memory/designs/DESIGN001-modernize-ui.md` and `memory/tasks/TASK002-modernize-ui.md`).
- Opened PR `codex/overhaul-website-ui-and-fix-404-error` (PR #18) with visual and accessibility improvements.

### 2026-01-17

- Backfilled memory: added Requirements, Decision Record for UI modernization, and created TASK004 to track tRPC follow-ups.
- Audited tests: Convex unit tests are comprehensive; integration & E2E suites need work (TASK003).

## Next milestones

- M1: Add Playwright E2E happy-path tests and enable CI job (`playwright:e2e:projects`).
- M2: Implement or document tRPC procedures and add unit tests (TASK004).

(Updated 2026-01-17)
