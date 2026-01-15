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