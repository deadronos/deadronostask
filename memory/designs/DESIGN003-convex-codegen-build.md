# DESIGN003 - Convex Codegen During Build

**Status:** Draft
**Date:** 2026-01-16

## Overview

Vercel builds fail because `src/convex/_generated` is ignored by Git and not created during the build. Add a build-time codegen step so `npm run build` always produces the Convex bindings before `next build` runs.

## Architecture

- `npm run build` triggers `prebuild`.
- `prebuild` runs `convex codegen` to generate `src/convex/_generated`.
- `build` continues to `next build`.
- Vercel’s `convex deploy --cmd 'npm run build'` inherits the same flow.

## Data Flow

```mermaid
flowchart LR
    A[convex deploy --cmd "npm run build"] --> B[prebuild: convex codegen]
    B --> C[next build]
```

## Interfaces

- `package.json` scripts: add `prebuild` entry.
- No runtime code changes.

## Error Handling

- Fail the build if `convex codegen` exits non-zero.

## Tasks

- Add `prebuild` script for Convex codegen.
- Run lint/format to confirm no formatting issues.
- Update memory bank entries for requirements, design, and task progress.
