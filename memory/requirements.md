# Requirements

**Last updated:** 2026-01-16

## Build pipeline

- WHEN `npm run build` executes in CI or Vercel, THE SYSTEM SHALL generate Convex `_generated` bindings before `next build` runs. [Acceptance: `npm run build` completes without `Module not found: '@/convex/_generated/api'` errors.]
- WHEN developers run `npm run build` locally, THE SYSTEM SHALL produce/update `src/convex/_generated` so TypeScript imports resolve. [Acceptance: `src/convex/_generated/api.js` exists after build.]
- WHEN Convex codegen fails, THE SYSTEM SHALL surface the failure as a build error. [Acceptance: CI build exits non-zero with the codegen error output.]
