// Ensure test env has a Convex URL so any module that constructs a client at import time doesn't throw
process.env.NEXT_PUBLIC_CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? 'http://localhost';
// If a Convex adapter secret is required by server-only modules, make a harmless default during tests
process.env.CONVEX_AUTH_ADAPTER_SECRET = process.env.CONVEX_AUTH_ADAPTER_SECRET ?? 'test-secret';

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Search: () => React.createElement('span', { 'data-icon': 'Search' }),
  Plus: () => React.createElement('span', { 'data-icon': 'Plus' }),
  Sparkles: () => React.createElement('span', { 'data-icon': 'Sparkles' }),
  Pencil: () => React.createElement('span', { 'data-icon': 'Pencil' }),
  X: () => React.createElement('span', { 'data-icon': 'X' }),
  CheckCircle2: () => React.createElement('span', { 'data-icon': 'CheckCircle2' }),
  CalendarDays: () => React.createElement('span', { 'data-icon': 'CalendarDays' }),
  Inbox: () => React.createElement('span', { 'data-icon': 'Inbox' }),
  Settings: () => React.createElement('span', { 'data-icon': 'Settings' }),
  ChevronDown: () => React.createElement('span', { 'data-icon': 'ChevronDown' }),
  ChevronUp: () => React.createElement('span', { 'data-icon': 'ChevronUp' }),
  Trash2: () => React.createElement('span', { 'data-icon': 'Trash2' }),
  Check: () => React.createElement('span', { 'data-icon': 'Check' }),
}));

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
    ConvexProviderWithAuth: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
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

// Provide per-test helpers and ensure convex-related mocks are reset and defaults applied before each test.
import { resetConvexMocks, mockUseQueryReturn, mockUseMutationReturn } from './utils/mocks/convex';
import { beforeEach } from 'vitest';

// Global mock for next-auth so components that import SessionProvider or useSession don't try to contact real auth
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  useSession: vi.fn().mockReturnValue({ data: null, status: 'unauthenticated', update: vi.fn() }),
  signOut: vi.fn(),
}));

// Global fetch stub to prevent accidental network calls in tests; tests can override with vi.spyOn(globalThis, 'fetch')
if (!globalThis.fetch) {
  // @ts-ignore - add a lightweight fetch mock
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
}

beforeEach(() => {
  resetConvexMocks();
  // Apply sane defaults for convex hooks so components that render without per-test setup behave consistently
  mockUseQueryReturn(undefined);
  mockUseMutationReturn(vi.fn());
  // Re-stub fetch default so per-test overrides are predictable
  // @ts-ignore
  (globalThis.fetch as unknown) = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
});

// Clean up DOM after each test to avoid cross-test leakage
afterEach(() => {
  cleanup();
});
