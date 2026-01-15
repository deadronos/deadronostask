---
name: copilot-instructions
description: Project-specific Copilot guidance for Next.js, Convex, and NextAuth.
applyTo: "**"
---

## Scope

Use these instructions for all changes in this repo. Keep responses brief,
impersonal, and follow existing patterns. Prefer minimal diffs and avoid
reformatting unrelated code.

## Architecture snapshot

- Next.js App Router with server components and client components.
- Convex for realtime data, queries, and mutations.
- NextAuth for authentication and session management.
- Tailwind CSS v4 with design tokens in CSS variables.

## Next.js (App Router) best practices

- Keep server-only logic in server components or route handlers.
- Mark interactive UI files with `"use client"` and keep them focused.
- Avoid importing client-only modules in server components.
- Use `redirect()` for auth gating in server layouts.
- Prefer small components and pass data via props when practical.

## Convex best practices

- Keep business logic in Convex functions, not the UI.
- Enforce authorization in Convex functions using `requireUserId()` and
  ownership checks like `assertOwned()`.
- Use indexed queries for filters and ordering.
- Prefer fewer, richer mutations over many small calls.
- Return minimal data required by the UI.

## NextAuth best practices

- Use short-lived Convex tokens signed on the server.
- Never expose server secrets in the client.
- Keep session data minimal and validated.
- Handle missing env variables with clear errors.

## Error handling and UX

- Wrap client mutations in try/catch and show `toast.error()` on failures.
- Avoid silent failures and log with `console.error()`.
- Disable buttons during long-running actions when possible.
- Keep optimistic updates consistent with Convex truth.

## Accessibility and linting

- Ensure form fields have accessible labels via `htmlFor` and `id`.
- Avoid inline styles; use Tailwind classes and `cn()` helpers.
- Provide `aria-label` for icon-only buttons.

## Performance

- Avoid unnecessary subscriptions and re-renders.
- Memoize derived data with `React.useMemo()` when it is expensive.
- Batch writes in a single mutation when updates are related.

## Testing and validation

- Add tests for critical business logic when introducing new behaviors.
- Prefer unit tests for Convex functions where feasible.
- Validate edge cases for auth, ownership, and missing data.

## Documentation

- Update relevant docs when adding features or changing workflows.
- Keep instructions and README aligned with current behavior.
