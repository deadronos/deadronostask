# TASK003 - Fix Vercel Convex Codegen Build

**Status:** Completed  
**Added:** 2026-01-16  
**Updated:** 2026-01-16

## Original Request

"you can find the recent logs in docs\vercellogs.txt please fix"

## Thought Process

The Vercel build fails with `Module not found: '@/convex/_generated/api'` because `src/convex/_generated` is gitignored and not generated during `npm run build`. The build should run `convex codegen` prior to `next build` so the bindings exist in CI. This is a build pipeline change; no runtime logic changes are required.

## Implementation Plan

- **Red**: Not applicable (config change; no unit test target).
- **Green**: Add a `prebuild` script that runs `convex codegen` before `next build`.
- **Refactor**: Keep scripts minimal and ensure lint/format still pass.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description                               | Status   | Updated    | Notes                          |
| --- | ----------------------------------------- | -------- | ---------- | ------------------------------ |
| 1.1 | Review Vercel logs and confirm root cause | Complete | 2026-01-16 | Missing Convex `_generated`    |
| 1.2 | Add build-time Convex codegen             | Complete | 2026-01-16 | Added `prebuild` script        |
| 1.3 | Run lint/format to validate changes       | Complete | 2026-01-16 | `npm run lint`, `format:write` |

## Progress Log

### 2026-01-16

- Reviewed Vercel logs and confirmed missing `src/convex/_generated` bindings during build.
- Added `prebuild` script to run `convex codegen` before `next build`.
- Ran `npm run lint` and `npm run format:write` to validate formatting.
