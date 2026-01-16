import * as React from 'react';

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Session } from '@/auth/types';

type CapturedAuth = {
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchAccessToken: (args?: { forceRefreshToken?: boolean }) => Promise<string | null>;
};

let capturedAuth: CapturedAuth | null = null;

vi.mock('@/lib/convex-client', () => {
  return {
    ConvexReactClient: class ConvexReactClient {
      // eslint-disable-next-line @typescript-eslint/no-useless-constructor
      constructor(_url: string) {}
    },
    ConvexProviderWithAuth: ({ useAuth, children }: any) => {
      // Call the provided hook in a React component context and expose results.
      capturedAuth = useAuth();
      return <>{children}</>;
    },
  };
});

const mockedGetSessionClient = vi.fn<[], Promise<Session | null>>();
const mockedUseSession = vi.fn<[], { data: Session | null; status: 'loading' | 'authenticated' }>();

vi.mock('@/lib/auth-client', () => {
  return {
    SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    signOut: vi.fn(),
    useSession: () => mockedUseSession(),
    getSessionClient: () => mockedGetSessionClient(),
  };
});

import { AppProviders } from '@/components/AppProviders';

describe('AppProviders Convex auth wiring', () => {
  it('treats a logged-in session without convexToken as loading and not authenticated', async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = 'https://example.convex.cloud';
    mockedUseSession.mockReturnValue({
      status: 'authenticated',
      data: {
        userId: 'u1',
        // Intentionally missing convexToken
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    mockedGetSessionClient.mockResolvedValue(null);

    render(
      <AppProviders session={null}>
        <div />
      </AppProviders>,
    );

    expect(capturedAuth).not.toBeNull();
    expect(capturedAuth!.isLoading).toBe(true);
    expect(capturedAuth!.isAuthenticated).toBe(false);
  });

  it('uses convexToken for Convex auth and can fetch the access token', async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = 'https://example.convex.cloud';
    mockedUseSession.mockReturnValue({
      status: 'authenticated',
      data: {
        userId: 'u1',
        convexToken: 'token-123',
      } as Session,
    });
    mockedGetSessionClient.mockResolvedValue({
      userId: 'u1',
      convexToken: 'token-456',
    } as Session);

    render(
      <AppProviders session={null}>
        <div />
      </AppProviders>,
    );

    expect(capturedAuth).not.toBeNull();
    expect(capturedAuth!.isLoading).toBe(false);
    expect(capturedAuth!.isAuthenticated).toBe(true);
    await expect(capturedAuth!.fetchAccessToken()).resolves.toBe('token-123');
    await expect(capturedAuth!.fetchAccessToken({ forceRefreshToken: true })).resolves.toBe('token-456');
  });
});
