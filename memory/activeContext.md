# Active Context

**Last updated:** 2026-01-16

## Current Focus

- Confirm Vercel build success after adding Convex codegen prebuild step

## Recent Changes

- Added requirements/design/task docs for Convex codegen build fix.
- Added `prebuild` script to run `convex codegen` before `next build`.
- Ran lint and formatting to validate changes.

## Next Steps

- Run a fresh Vercel deploy (or `npm run build`) to confirm the module resolution error is gone.

## Notes

- Keep tasks small and test-first. For PoCs, document success criteria and keep them time-boxed (1-2 days).
