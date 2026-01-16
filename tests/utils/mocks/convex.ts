import { vi } from 'vitest';
import type { Mock } from 'vitest';

// Import the mocked module surfaces (these modules are mocked in tests/setup.ts)
import * as convexReact from 'convex/react';
import * as convexBrowser from 'convex/browser';

// Helpers to access mocked functions safely
export const useQueryMock = vi.mocked((convexReact as any).useQuery as unknown as Mock);
export const useMutationMock = vi.mocked((convexReact as any).useMutation as unknown as Mock);

// For the HTTP client class, the mock is a constructor function. We provide helpers
// to get the prototype mocked methods for assertions.
export const ConvexHttpClientMock = (convexBrowser as any).ConvexHttpClient as any;

export function mockUseQueryReturn(value: unknown) {
  useQueryMock.mockReturnValue(value);
}

export function mockUseQueryReturnOnce(value: unknown) {
  useQueryMock.mockReturnValueOnce(value);
}

export function mockUseMutationReturn(value: unknown) {
  useMutationMock.mockReturnValue(value);
}

export function mockHttpClientQueryReturn(returnValue: unknown) {
  if (!ConvexHttpClientMock) return;
  ConvexHttpClientMock.prototype.query = vi.fn().mockResolvedValue(returnValue);
}

export function mockHttpClientMutationReturn(returnValue: unknown) {
  if (!ConvexHttpClientMock) return;
  ConvexHttpClientMock.prototype.mutation = vi.fn().mockResolvedValue(returnValue);
}

export function resetConvexMocks() {
  vi.resetAllMocks();
}
