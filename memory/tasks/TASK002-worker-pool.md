# [TASK003] Worker Pool for CPU-bound tasks

**Status:** Pending  
**Added:** 2026-01-15

## Original Request

Introduce a small Worker Pool helper to offload CPU-heavy operations (e.g., simulation loops, large data parsing) from the main thread with predictable concurrency and lifecycle.

## Thought Process

- Some features may require CPU work that should not block the UI thread; a worker pool with a small API (postTask → result, cancel) reduces complexity and centralizes worker reuse.

## Requirements (EARS)

- WHEN the app needs to run a CPU-bound operation, THE SYSTEM SHALL dispatch it to a worker from a pool with a bounded concurrency (Acceptance: main thread remains responsive and tasks return correct results)
- THE SYSTEM SHALL expose an API to submit tasks, receive results, and cancel tasks (Acceptance: TypeScript typings + unit tests)
- THE SYSTEM SHALL support transferables for large binary data (Acceptance: tests and docs)

## Implementation Plan

- Design a minimal Promise-based API and worker bootstrap (see `/memory/designs/DESIGN002-worker-pool.md`)
- Create unit tests for dispatch/cancel/reuse
- Integrate with a sample feature that benefits from offloading

## Acceptance

- Unit tests cover the pool behavior and cancellation
- A demo shows improved main-thread responsiveness

## Notes

- Keep worker code small and testable; prefer serialized messages and simple input/output shapes.
