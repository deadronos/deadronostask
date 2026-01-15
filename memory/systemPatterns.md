# System Patterns

## Architecture

- Next.js (App Router) with server components for server-only logic and client components for interactive UI.
- Convex as the realtime backend (queries/mutations/functions). Business logic belongs in Convex functions.
- NextAuth for auth with server-side secured routes, minimal session payloads.
- Tailwind CSS with design tokens.

## Patterns and Conventions

- Server-only logic stays in server components/route handlers.
- Use Convex functions for authorization checks (requireUserId(), assertOwned()).
- Keep components small and focused. Use `use client` only where necessary.
- Use accessible locators and role-based selectors in tests (Playwright guidelines).
- TDD cycle for business logic changes.

## Error handling

- Catch and surface errors to UI as toasts; log to console for developer debugging.
- Fail-fast for missing environment variables or critical services.

## Testing

- Unit tests with Vitest for Convex functions and core utils
- Playwright for end-to-end checks on main flows
- CI checks should include lint, format, and tests
