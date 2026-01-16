# Integration Tests

This directory contains integration tests for the task management application.

## Overview

Integration tests verify that different parts of the application work together correctly. They test the interaction between multiple components, modules, or services.

## Structure

```
tests/integration/
├── README.md (this file)
├── auth.test.ts (authentication flow tests)
├── task-workflow.test.ts (task CRUD workflow tests)
└── project-workflow.test.ts (project CRUD workflow tests)
```

## Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test file
npm run test:integration -- tests/integration/auth.test.ts

# Run with coverage
npm run test:integration -- --coverage
```

## Writing Integration Tests

Integration tests should:

1. Test realistic user workflows
2. Use actual database interactions (with test database)
3. Verify that components work together correctly
4. Test error handling across boundaries
5. Mock external services (e.g., third-party APIs)

### Example Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Task Workflow Integration', () => {
  beforeEach(async () => {
    // Setup test database and environment
  });

  afterEach(async () => {
    // Cleanup test data
  });

  it('should create, update, and complete a task', async () => {
    // Test implementation
  });
});
```

## Best Practices

- Use descriptive test names that explain the workflow being tested
- Clean up test data after each test
- Use realistic test data
- Test both happy paths and error scenarios
- Keep tests independent and isolated
- Use proper assertions to verify expected outcomes

## TODO

- [ ] Implement authentication flow tests
- [ ] Implement task workflow tests
- [ ] Implement project workflow tests
- [ ] Add tests for realtime updates
- [ ] Add tests for data synchronization
