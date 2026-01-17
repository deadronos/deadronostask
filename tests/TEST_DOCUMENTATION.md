# Testing Documentation

This document provides comprehensive information about the testing strategy and setup for the task management application.

## Table of Contents

- [Overview](#overview)
- [Test Types](#test-types)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

This project uses a comprehensive testing strategy with three types of tests:

1. **Unit Tests** - Test individual Convex functions in isolation
2. **Integration Tests** - Test interactions between components (scaffold)
3. **End-to-End Tests** - Test complete user workflows (scaffold)

## Test Types

### Unit Tests (Convex Functions)

Located in `tests/convex/`, these tests use `convex-test` to test Convex functions with a mocked backend.

**Coverage:**

- ✅ `tasks.ts` - All CRUD operations and queries
- ✅ `projects.ts` - All CRUD operations and queries
- ✅ `users.ts` - User upsert and retrieval

**Framework:** Vitest + convex-test  
**Environment:** edge-runtime

**Example:**

```typescript
import { convexTest } from 'convex-test';
import { api } from '@/convex/_generated/api';
import schema from '@/convex/schema';

describe('tasks', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    t = convexTest(schema);
  });

  it('should create a task', async () => {
    await t.run(async ctx => {
      ctx.auth = { getUserIdentity: async () => ({ subject: 'user123' }) } as any;
      const taskId = await t.mutation(api.tasks.create, { title: 'Test' });
      expect(taskId).toBeDefined();
    });
  });
});
```

### Integration Tests (Scaffold)

Located in `tests/integration/`, these tests verify that different parts of the application work together.

**Planned Coverage:**

- Authentication flows with Clerk and Convex
- Task workflows with database interactions
- Project workflows with task associations
- Real-time data synchronization

**Framework:** Vitest  
**Status:** 📋 Scaffolded, not yet implemented

### End-to-End Tests (Scaffold)

Located in `tests/e2e/`, these tests verify the application from a user's perspective using Playwright.

**Planned Coverage:**

- Complete authentication flows (sign up, sign in, sign out)
- Task management UI interactions
- Project management UI interactions
- Real-time updates across browser tabs

**Framework:** Playwright  
**Status:** 📋 Scaffolded, not yet implemented

## Test Structure

```
tests/
├── convex/                      # Unit tests for Convex functions
│   ├── tasks.test.ts           # ✅ Task function tests (48 tests)
│   ├── projects.test.ts        # ✅ Project function tests (19 tests)
│   └── users.test.ts           # ✅ User function tests (10 tests)
├── integration/                 # Integration tests (scaffold)
│   ├── README.md
│   ├── auth.test.ts            # 📋 Auth workflow tests
│   ├── task-workflow.test.ts   # 📋 Task integration tests
│   └── project-workflow.test.ts # 📋 Project integration tests
├── e2e/                         # E2E tests (scaffold)
│   ├── README.md
│   ├── auth.spec.ts            # 📋 Auth E2E tests
│   ├── tasks.spec.ts           # 📋 Task E2E tests
│   └── projects.spec.ts        # 📋 Project E2E tests
└── utils/                       # Test utilities
    └── mocks/
        └── convex.ts           # Mock helpers for Convex
```

## Running Tests

### Unit Tests (Convex)

```bash
# Run all Convex unit tests
npm run test:convex

# Watch mode
npm run test:convex -- --watch

# Run specific test file
npm run test:convex -- tests/convex/tasks.test.ts

# Run with coverage
npm run test:convex -- --coverage
```

### All Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Tests (When Implemented)

```bash
npm run test:integration
```

### E2E Tests (When Implemented)

```bash
npm run test:e2e
```

## Writing Tests

### Unit Test Guidelines

1. **Use convex-test for isolated testing**

   ```typescript
   import { convexTest } from 'convex-test';
   import schema from '@/convex/schema';

   let t = convexTest(schema);
   ```

2. **Mock authentication**

   ```typescript
   ctx.auth = {
     getUserIdentity: async () => ({ subject: 'userId' }),
   } as any;
   ```

3. **Test both success and error cases**

   ```typescript
   // Success case
   it('should create task', async () => {
     const taskId = await t.mutation(api.tasks.create, { title: 'Test' });
     expect(taskId).toBeDefined();
   });

   // Error case
   it('should throw error for empty title', async () => {
     await expect(t.mutation(api.tasks.create, { title: '   ' })).rejects.toThrow(
       'Task title is required',
     );
   });
   ```

4. **Test authorization**

   ```typescript
   it('should throw error if user does not own task', async () => {
     // Create as user1
     ctx.auth = { getUserIdentity: async () => ({ subject: 'user1' }) } as any;
     const taskId = await t.mutation(api.tasks.create, { title: 'Task' });

     // Try to update as user2
     ctx.auth = { getUserIdentity: async () => ({ subject: 'user2' }) } as any;
     await expect(t.mutation(api.tasks.update, { taskId, title: 'New' })).rejects.toThrow(
       'Unauthorized',
     );
   });
   ```

### Test Naming Conventions

- Use descriptive test names: `should [expected behavior] when [condition]`
- Group related tests with `describe` blocks
- Use `it.todo()` for planned tests that aren't implemented yet

### Test Organization

```typescript
describe('feature', () => {
  describe('specific function', () => {
    it('should handle success case', () => {});
    it('should handle error case', () => {});
    it('should validate input', () => {});
    it('should check authorization', () => {});
  });
});
```

## Best Practices

### General

1. **Test behavior, not implementation** - Focus on what the function does, not how
2. **Keep tests isolated** - Each test should be independent
3. **Use clear assertions** - Make expected outcomes obvious
4. **Clean up test data** - Ensure tests don't affect each other
5. **Test edge cases** - Empty strings, null values, boundary conditions
6. **Mock external dependencies** - Authentication, external APIs

### Unit Tests

1. **Use fresh test instance** - Create new `convexTest` in `beforeEach`
2. **Test all code paths** - Success, errors, edge cases
3. **Verify data integrity** - Check database state after operations
4. **Test authorization** - Ensure proper access control
5. **Test validation** - Input validation and error messages

### Integration Tests (When Implementing)

1. **Use realistic workflows** - Test actual user scenarios
2. **Test component interactions** - Verify systems work together
3. **Handle async operations** - Use proper async/await patterns
4. **Clean up after tests** - Remove test data
5. **Mock external services** - Third-party APIs, authentication

### E2E Tests (When Implementing)

1. **Use Page Object Model** - Organize selectors and actions
2. **Wait for elements** - Don't use fixed timeouts
3. **Use data-testid** - Reliable element selection
4. **Test happy and sad paths** - Success and error scenarios
5. **Test across browsers** - Chromium, Firefox, WebKit

## Configuration Files

### vitest.config.ts

Main Vitest configuration for unit and integration tests.

### vitest.convex.config.ts

Specialized configuration for Convex function tests using edge-runtime.

### playwright.config.ts (To be created)

Configuration for E2E tests when implemented.

## Coverage Goals

### Current Coverage (Unit Tests)

- ✅ **tasks.ts**: 100% function coverage (6/6 functions)
  - list, create, update, setStatus, reorder, archive
- ✅ **projects.ts**: 100% function coverage (4/4 functions)
  - list, create, update, archive
- ✅ **users.ts**: 100% function coverage (2/2 functions)
  - upsertMe, getMe

### Target Coverage

- Unit tests: 90%+ code coverage
- Integration tests: Key workflows covered
- E2E tests: Critical user paths covered

## Troubleshooting

### Common Issues

**Issue: Tests fail with "Unauthenticated" error**

```typescript
// Solution: Mock auth correctly
ctx.auth = { getUserIdentity: async () => ({ subject: 'userId' }) } as any;
```

**Issue: Tests hang or timeout**

```typescript
// Solution: Ensure all async operations are awaited
await t.mutation(api.tasks.create, { title: 'Test' });
```

**Issue: Type errors with convex-test**

```typescript
// Solution: Use type assertions for auth mocking
ctx.auth = { getUserIdentity: async () => ({ subject: 'userId' }) } as any;
```

**Issue: Tests pass locally but fail in CI**

- Check environment variables
- Ensure dependencies are installed
- Verify Node.js version compatibility

### Getting Help

- Check test output for specific error messages
- Review test examples in `tests/convex/`
- Consult [convex-test documentation](https://docs.convex.dev/testing/convex-test)
- Check Vitest documentation for test runner issues

## Next Steps

### For Integration Tests

1. Implement auth workflow integration tests
2. Add task workflow integration tests
3. Add project workflow integration tests
4. Test real-time data synchronization

### For E2E Tests

1. Set up Playwright configuration
2. Create Page Object Models
3. Implement authentication E2E tests
4. Implement task management E2E tests
5. Implement project management E2E tests
6. Add visual regression testing
7. Add accessibility testing

## Contributing

When adding new features:

1. Write unit tests first (TDD approach)
2. Ensure all tests pass before committing
3. Add integration tests for workflows
4. Add E2E tests for user-facing features
5. Update this documentation as needed

## Resources

- [Convex Testing Documentation](https://docs.convex.dev/testing/convex-test)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
