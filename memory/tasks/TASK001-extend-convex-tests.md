# TASK001 - Extend and repair Convex unit tests

**Status:** Completed  
**Added:** 2025-02-14  
**Updated:** 2025-02-14

## Original Request

"extend tests, also fix tests"

## Thought Process

Convex unit tests are failing because convex-test cannot locate the generated modules. Update tests to pass an import.meta.glob map for Convex modules, then extend coverage with a task update edge case for clearing projectId. Keep changes limited to tests.

## Implementation Plan

- **Red**: Add a test for clearing projectId and observe current failure (module loading).
- **Green**: Fix module loading by providing convexTest with import.meta.glob modules.
- **Refactor**: Keep test setup consistent across Convex test files.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description                                       | Status      | Updated     | Notes                               |
| --- | ------------------------------------------------- | ----------- | ----------- | ----------------------------------- |
| 1.1 | Add failing test for clearing task projectId      | Complete    | 2025-02-14  | Added in tasks.test.ts              |
| 1.2 | Fix convex-test module loading in unit tests      | Complete    | 2025-02-14  | Added import.meta.glob modules map  |
| 1.3 | Run lint/format/tests and update status           | Complete    | 2025-02-14  | Lint/format warnings noted          |

## Progress Log

### 2025-02-14

- Added a task update test to clear projectId.
- Switched convexTest setup to use import.meta.glob for module loading.
- Memory bank initialized for task tracking.

### 2025-02-14

- Refactored Convex unit tests to avoid nested transactions and fixed failing cases.
- Added eager module loader helper and updated schema to allow null dueAt.
- Ran lint, format check, and Convex test suite.
