# Progress

**As of:** 2026-01-16

## What works

- Core task flows implemented (create, edit, complete tasks)
- Convex integration present and used for tasks and projects
- Authentication is configured via NextAuth

## What's left / Backlog highlights

- Add and document performance-focused improvements relevant to current stack (e.g., Worker Pool)
- Offload CPU heavy loops to Worker Pool and create tests
- Improve test coverage for Convex functions and E2E flows

## Blockers

- None current; recommend starting PoC tasks in the next sprint.

## Notes

- Prioritize small, measurable changes that can be validated with tests and performance checks.

## Progress Log

### 2026-01-15

- Created memory bank core files and initial designs: `DESIGN002-worker-pool.md`. Archived `DESIGN001-dynamic-res-scaler.md` as not applicable.
- Added tasks: `TASK001` (completed), `TASK002` (archived), `TASK003` (pending).

### 2026-01-16

- Logged Vercel build failure caused by missing Convex `_generated` bindings.
- Added design/requirements/task docs for build-time Convex codegen fix.
- Removed build-time codegen, tracked `src/convex/_generated`, and ran lint/format.
- Added normalization helper and tests for Convex auth private key formatting.
- Documented Vercel env formatting guidance for auth private key.
- Refreshed Convex access token when missing to prevent hanging mutations.
- Tightened Convex auth state to avoid stuck loading when token is missing.
