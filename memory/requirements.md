# Requirements

**Last updated:** 2026-01-16

## Build pipeline

- WHEN CI or Vercel runs `npm run build`, THE SYSTEM SHALL rely on committed `src/convex/_generated` bindings rather than running Convex codegen. [Acceptance: build succeeds without `Module not found: '@/convex/_generated/api'` errors and no `convex codegen` step in CI.]
- WHEN developers update Convex functions or schema, THE SYSTEM SHALL regenerate bindings locally and commit the updated `src/convex/_generated` files. [Acceptance: git shows updated `_generated` files after running `npx convex codegen`.]
- WHEN Convex codegen fails locally, THE SYSTEM SHALL surface the failure to the developer. [Acceptance: `npx convex codegen` exits non-zero with error output.]

## Auth configuration

- WHEN the server reads `CONVEX_AUTH_PRIVATE_KEY`, THE SYSTEM SHALL accept quoted or `\n`-escaped PKCS#8 PEM strings and normalize them before parsing. [Acceptance: key parsing succeeds with escaped or quoted inputs.]
- WHEN the private key is not a valid PKCS#8 PEM, THE SYSTEM SHALL raise a clear error directing developers to regenerate and update env vars. [Acceptance: error message mentions `generateKeys.mjs` and Vercel env formatting.]
