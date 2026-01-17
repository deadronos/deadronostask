# Improvement Proposals - Antigravity

Based on the review of the code and architecture, here are 5 high-impact improvements to elevate the repository from "MVP" to "Production-Grade Product":

## 1. 🖱️ UX: Drag-and-Drop Reordering

**Context:** The backend (`ctx.db.patch ... order`) supports arbitrary ordering, and `tasks.ts` sorts by this field. However, there is no UI to manipulate it.
**Improvement:** Implement `@dnd-kit` (or `dnd-kit` via shadcn/ui examples) on the task list.
**Why:** Manual ordering is a core expectation for task management apps ("Linear-style"). It bridges the gap between the data structure you already built and the user experience.

## 2. 🔌 Feature: Real GitHub Integration (tRPC)

**Context:** `src/server/trpc/router.ts` currently has a placeholder `importIssues` procedure.
**Improvement:** Implement the actual logic using `octokit`. The tRPC procedure should fetch issues from GitHub and then call a Convex internal mutation to batch-insert them as tasks.
**Why:** This validates your specific architectural choice of "tRPC for services" vs "Convex for product data." It proves the hybrid stack's value.

## 3. ⌨️ UX: Command Palette (Cmd+K)

**Context:** Navigation is currently click-based.
**Improvement:** Add a global command palette using `cmdk`. Allow users to:

- Jump to a project.
- Create a new task (without using the mouse).
- Toggle theme or navigate settings.
  **Why:** Speed is the #1 feature for productivity tools. This is a low-effort, high-reward "wow" factor feature.

## 4. 🏷️ Data: Labels & Tagging System

**Context:** The spec mentioned Labels as "Optionally later," and they represent a missing many-to-many relationship in the schema.
**Improvement:**

- Add `labels` table (`name`, `color`, `ownerClerkUserId`).
- Add `taskLabels` join table.
- Update `tasks.list` to support filtering by multiple labels.
  **Why:** Users often need orthogonal organization (e.g., "Urgent", "Bug", "Feature") that cuts across rigid Project boundaries.

## 5. 🧪 Quality: Critical Flow E2E Tests

**Context:** You have `playwright` installed, but test coverage is likely minimal for the complex integration parts.
**Improvement:** create a "Critical User Journey" test suite:

1. User logs in (mocked Clerk).
2. Creates a Project.
3. Adds a Task in that Project.
4. Verifies the Task appears in the Dashboard list.
   **Why:** Prevents regressions in the core loop as you refactor or upgrade dependencies (like the recent generic Next.js 15/16 shifts).
