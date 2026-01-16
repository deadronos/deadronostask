'use client';

import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { SessionProvider, useSession } from 'next-auth/react';
import * as React from 'react';

import type { Session } from '@/auth/types';

function useConvexAuth() {
  const { data: session, status, update } = useSession();
  const fetchAccessToken = React.useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken?: boolean } = {}) => {
      if (forceRefreshToken || (session?.userId && !session?.convexToken)) {
        const refreshed = await update();
        return refreshed?.convexToken ?? null;
      }
      return session?.convexToken ?? null;
    },
    [session, update],
  );

  return {
    isLoading: status === 'loading',
    isAuthenticated: Boolean(session?.userId),
    fetchAccessToken,
  };
}

export function AppProviders({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error('Missing NEXT_PUBLIC_CONVEX_URL');
  }
  // Defer creating the Convex client until render time so tests can mock the module
  const convex = React.useMemo(() => new ConvexReactClient(convexUrl), [convexUrl]);

  return (
    <SessionProvider session={session}>
      <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
        {children}
      </ConvexProviderWithAuth>
    </SessionProvider>
  );
}
