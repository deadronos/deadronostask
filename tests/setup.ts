// Ensure test env has a Convex URL so any module that constructs a client at import time doesn't throw
process.env.NEXT_PUBLIC_CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? 'http://localhost';
// If a Convex adapter secret is required by server-only modules, make a harmless default during tests
process.env.CONVEX_AUTH_ADAPTER_SECRET = process.env.CONVEX_AUTH_ADAPTER_SECRET ?? 'test-secret';

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi, afterEach } from 'vitest';

vi.mock('lucide-react', () => {
  return new Proxy(
    {},
    {
      get: (_, prop) => {
        if (typeof prop === 'string') {
          return function MockIcon() {
            return React.createElement('span', { 'data-icon': prop });
          };
        }
        return undefined;
      },
    },
  );
});

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Provide a lightweight global mock for Convex so importing components
// during tests doesn't initialize real clients, subscriptions, or make network calls.
vi.mock('convex/react', () => {
  // Use the React import above
  return {
    // Stub the client and provider used in AppProviders so no network is attempted at import time
    ConvexReactClient: class {
      constructor() {}
    },
    ConvexProviderWithAuth: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    // Keep hooks mocked for components that rely on them
    useQuery: vi.fn(),
    useMutation: vi.fn(),
  };
});

// Also stub the browser HTTP client to avoid any accidental network activity
vi.mock('convex/browser', () => ({
  ConvexHttpClient: class {
    constructor() {}
    query = vi.fn();
    mutation = vi.fn();
  },
}));

// Prevent importing the generated Convex API (which pulls in `convex/server`) during tests.
// Components import `@/convex/_generated/api`; mock it to avoid loading server-only modules.
vi.mock('@/convex/_generated/api', () => ({
  api: {
    labels: { list: 'labels.list' },
    projects: { list: 'projects.list' },
    tasks: {
      create: 'tasks.create',
      update: 'tasks.update',
      remove: 'tasks.remove',
      toggleComplete: 'tasks.toggleComplete',
      reorderInProject: 'tasks.reorderInProject',
    },
    authAdapter: {},
  },
}));

// Provide per-test helpers and ensure mocks are reset between tests.
import { resetConvexMocks } from './utils/mocks/convex';

afterEach(() => {
  resetConvexMocks();
});