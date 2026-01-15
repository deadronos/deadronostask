// Ensure test env has a Convex URL so any module that constructs a client at import time doesn't throw
process.env.NEXT_PUBLIC_CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? 'http://localhost';

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

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

// Provide a lightweight global mock for Convex hooks so importing components
// during tests doesn't initialize real clients or subscriptions.
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
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