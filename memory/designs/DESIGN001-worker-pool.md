# DESIGN002 — Worker Pool (Browser WorkerPool)

**Author:** Memory Bank (retroactive)  
**Created:** 2026-01-15

## Overview

A small, typed Worker Pool library to submit CPU-bound tasks from the main thread to Web Workers with bounded concurrency, cancellation support, and optional transferable support.

## Goals

- Keep the main thread responsive
- Provide an ergonomic, Promise-based API
- Reuse workers to avoid spawn costs
- Strong TypeScript typings for tasks

## API (proposal)

- `createWorkerPool<TInput, TOutput>({scriptUrl, maxWorkers})`
- `pool.submit(taskData: TInput): Promise<TOutput>`
- `const job = pool.submit(...); job.cancel()` — optional cancellation token
- `pool.terminate()` to release resources

## Worker bootstrap

- Single worker script supporting a registry of named handlers (helpful for multiple tasks)
- Handlers register via message types: `{type: 'handler:register', name}` during build-time bundling or simple export pattern

## Features

- Transferable support for ArrayBuffer
- Queueing when all workers busy
- Metrics hooks: `onWorkerCreated`, `onTaskStart/End`, `onTaskError`

## Edge Cases & Safety

- Worker errors should be returned as rejections with stack where possible
- Task serialization: prefer simple JSON-serializable payloads; provide explicit `transfer` param for ArrayBuffer
- Cancellation should send a cancel message; workers should check for cancellation where feasible

## Testing Strategy

- Unit tests for queueing, concurrency, cancellation
- Integration demo: offload a heavy CPU task (e.g., primes/isPrime large) and show main thread stays responsive

## Implementation Plan

1. Write unit tests for pool behavior (Red)
2. Implement pool internals and worker bootstrap (Green)
3. Add demo and integration tests (Refactor)

## Acceptance Criteria

- Tests covering concurrency & cancelation
- Demo page showing responsiveness improvement

---
