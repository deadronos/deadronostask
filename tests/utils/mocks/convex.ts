import * as convexBrowser from 'convex/browser';
import { vi, type Mock } from 'vitest';

import * as convexClient from '@/lib/convex-client';

// Helpers to access mocked functions safely
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useQueryMock = vi.mocked((convexClient as any).useQuery as unknown as Mock);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useMutationMock = vi.mocked((convexClient as any).useMutation as unknown as Mock);

// For the HTTP client class, the mock is a constructor function. We provide helpers
// to get the prototype mocked methods for assertions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  vi.clearAllMocks();
}
