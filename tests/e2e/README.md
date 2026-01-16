# End-to-End Tests

This directory contains end-to-end (E2E) tests for the task management application.

## Overview

End-to-end tests verify the application from a user's perspective, testing the complete flow through the UI and all underlying systems. These tests use Playwright to automate browser interactions.

## Structure

```
tests/e2e/
├── README.md (this file)
├── auth.spec.ts (authentication flow E2E tests)
├── tasks.spec.ts (task management E2E tests)
└── projects.spec.ts (project management E2E tests)
```

## Setup

E2E tests require additional setup:

1. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

2. Configure environment variables in `.env.test`:
   ```
   NEXT_PUBLIC_CONVEX_URL=<test-convex-url>
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<test-clerk-key>
   ```

## Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test file
npm run test:e2e tests/e2e/tasks.spec.ts

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run in debug mode
npm run test:e2e -- --debug

# Run with specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

## Writing E2E Tests

E2E tests should:

1. Test complete user workflows
2. Use realistic user interactions
3. Verify UI state and feedback
4. Test across different browsers
5. Handle asynchronous operations properly

### Example Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and sign in
    await page.goto('/');
    // Setup test user
  });

  test('should create and complete a task', async ({ page }) => {
    // Test implementation
  });
});
```

## Best Practices

- Use Page Object Model (POM) for better maintainability
- Use data-testid attributes for reliable element selection
- Wait for elements to be ready before interacting
- Clean up test data after tests
- Use realistic test scenarios
- Test error states and edge cases
- Keep tests independent

## Page Objects

Consider creating page objects for common pages:

```typescript
// pages/dashboard.page.ts
export class DashboardPage {
  constructor(private page: Page) {}

  async createTask(title: string) {
    // Implementation
  }

  async getTaskByTitle(title: string) {
    // Implementation
  }
}
```

## TODO

- [ ] Setup Playwright configuration
- [ ] Implement authentication E2E tests
- [ ] Implement task management E2E tests
- [ ] Implement project management E2E tests
- [ ] Add visual regression tests
- [ ] Add accessibility tests
- [ ] Add mobile viewport tests
