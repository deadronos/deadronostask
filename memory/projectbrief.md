# Project Brief

**Project:** deadronostask
**Repo:** deadronostask (owner: deadronos)
**Created:** 2026-01-15

## Summary

Deadronostask is a lightweight personal task manager built with Next.js (App Router), Convex for realtime backend and data, NextAuth for authentication, and Tailwind for styling. The app's goals are simplicity, good UX, and reliable data sync across devices.

## Primary Goals

- Fast and responsive UI with good accessibility
- Robust realtime sync via Convex
- Secure authentication with NextAuth
- Small, maintainable codebase with strong test coverage

## Success Metrics

- Core flows (create/edit/complete tasks, create projects, search) fully tested and stable
- No regressions in auth or data loss after Convex migration
- Performance: 95th percentile interactions < 100ms on common devices

## Constraints

- Keep secrets out of client bundles; handle auth server-side
- Keep new features small and test-first (TDD)

## Ownership

Maintainers: repository owners and contributors. For major changes, open an issue or PR and reference this project brief.
