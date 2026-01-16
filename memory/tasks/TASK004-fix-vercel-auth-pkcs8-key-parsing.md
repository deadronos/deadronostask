# TASK004 - Fix Vercel Auth PKCS#8 Key Parsing

**Status:** Completed  
**Added:** 2026-01-16  
**Updated:** 2026-01-16

## Original Request

"auth seems to work in locally run dev but the vercel deployed main throws when trying to auth"

## Thought Process

Vercel is throwing `SessionTokenError` due to `CONVEX_AUTH_PRIVATE_KEY` not being in proper PKCS#8 PEM format in production env vars. The key is likely pasted with quotes or `\n` escapes. Normalize the env value before parsing, add a clear error on invalid keys, and document Vercel env formatting.

## Implementation Plan

- **Red**: Add unit tests for key normalization with quoted and `\n`-escaped values.
- **Green**: Implement `normalizePkcs8Key` and use it before `importPKCS8` in `auth-utils`.
- **Refactor**: Keep helper small; update README guidance.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description                           | Status   | Updated    | Notes                            |
| --- | ------------------------------------- | -------- | ---------- | -------------------------------- |
| 1.1 | Add normalization helper + unit tests | Complete | 2026-01-16 | Added helper + tests             |
| 1.2 | Update auth-utils to normalize key    | Complete | 2026-01-16 | Normalize before import          |
| 1.3 | Update README + run lint/format/tests | Complete | 2026-01-16 | `lint`, `format:write`, `vitest` |

## Progress Log

### 2026-01-16

- Logged Vercel runtime error for invalid PKCS#8 key formatting.
- Planned normalization helper and test coverage for quoted/escaped env values.
- Added `normalizePkcs8Key`, updated `auth-utils`, and documented Vercel env formatting.
- Ran `npx vitest run tests/unit/convex-auth-key.test.ts`, `npm run lint`, and `npm run format:write`.
