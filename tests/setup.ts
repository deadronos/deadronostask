import { expect, vi } from 'vitest';
// `@testing-library/jest-dom` expects a global `expect`. Vitest is configured
// with `globals: false`, so attach the `expect` from Vitest to `globalThis`.
(globalThis as any).expect = expect;
// Importing jest-dom dynamically ensures the global `expect` is set before
// `jest-dom` registers its matchers.
// Use eval to avoid TypeScript trying to resolve the package as a module
// during the Next build typecheck (some jest-dom typings are not ESM-friendly).
await (eval('import("@testing-library/jest-dom")') as Promise<any>);

// Mock convex client-side hooks used in components
vi.mock('convex/react', () => {
  return {
    useQuery: vi.fn(),
    useMutation: vi.fn(),
  };
});

// Provide a simple mock for the browser HTTP client so tests can stub
// `query` and `mutation` on the prototype.
vi.mock('convex/browser', () => {
  class ConvexHttpClient {
    query = vi.fn();
    mutation = vi.fn();
  }

  return { ConvexHttpClient };
});
