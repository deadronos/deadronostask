# Active Context

**Last updated:** 2026-01-16

## Current Focus

- Validate Convex mutations succeed after session token refresh fix

## Recent Changes

- Added normalization helper for `CONVEX_AUTH_PRIVATE_KEY` and tests.
- Updated README guidance for Vercel env formatting.
- Refresh Convex access token when missing in `AppProviders`.

## Next Steps

- Re-test create-task mutation locally and in Vercel after deploy.

## Notes

- Keep tasks small and test-first. For PoCs, document success criteria and keep them time-boxed (1-2 days).
