console.log('tests/setup.ts executed');
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