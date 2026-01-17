# Active Context

## Current Work

- UI modernization (TASK002) merged — component-driven `Card`/`Dialog`/`Input` primitives are in place and the `/projects` index route was added to fix navigation 404s.
- Convex functions (projects/tasks) are well-covered by unit tests; tRPC surface remains scaffolded but incomplete.

## Priorities (short-term)

1. Ship reliable E2E for core happy path (create project → open → create task → verify) — TASK003 (blocking release).
2. Harden tRPC procedures (implement or explicitly mark experimental) — TASK004.
3. Add Playwright ARIA snapshots for `main` regions and dialogs (improves automated accessibility checks).

## Blockers

- No deterministic Playwright coverage for project flows (causes release gating risk).
- Some tRPC procedures are placeholders which could be mistaken for production-ready APIs.
- Need to verify Clerk/Convex env vars in staging to avoid auth regressions on deployment.

## Next Steps (owners suggested)

- Frontend: complete TASK003 (Playwright E2E) — owner: frontend engineer.
- Backend: implement or mark tRPC procedures + add unit tests — owner: backend engineer.
- DevOps/CI: add `playwright:e2e:projects` job to PR workflow and run Convex unit tests on PRs (owner: infra/owner).

## Quick links

- Design: `memory/designs/DESIGN001-modernize-ui.md`
- UI task: `memory/tasks/TASK002-modernize-ui.md`
- E2E task: `memory/tasks/TASK003-projects-e2e-tests.md`
- tRPC task: `memory/tasks/TASK004-trpc-integrations.md`

(Backfilled 2026-01-17 by repo audit)
