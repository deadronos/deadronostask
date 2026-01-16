# DESIGN003 - Convex Codegen During Build

**Status:** Draft
**Date:** 2026-01-16

## Overview

Vercel builds fail because `src/convex/_generated` is ignored by Git and `convex codegen` cannot run in CI with only a deploy key. The fix is to commit the generated bindings and remove the build-time codegen step so CI can resolve imports without running codegen.

## Architecture

- `src/convex/_generated` is tracked in Git.
- Developers run `npx convex codegen` locally when Convex functions change.
- `npm run build` runs `next build` without invoking codegen.
- Vercel’s `convex deploy --cmd 'npm run build'` uses the committed bindings.

## Data Flow

```mermaid
flowchart LR
    A[developer runs convex codegen] --> B[commit src/convex/_generated]
    B --> C[convex deploy --cmd "npm run build"]
    C --> D[next build]
```

## Interfaces

- `.gitignore`: stop ignoring `src/convex/_generated`.
- `package.json`: remove `prebuild` codegen step.
- No runtime code changes.

## Error Handling

- Local codegen errors surface when running `npx convex codegen`.

## Tasks

- Remove build-time codegen hook and commit generated bindings.
- Update `.gitignore` to track `src/convex/_generated`.
- Run lint/format to confirm no formatting issues.
- Update memory bank entries for requirements, design, and task progress.
