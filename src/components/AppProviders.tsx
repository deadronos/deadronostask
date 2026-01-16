'use client';

import * as React from 'react';

import type { Session } from '@/auth/types';
import { getSessionClient, SessionProvider, useSession } from '@/lib/auth-client';
import { ConvexProviderWithAuth, ConvexReactClient } from '@/lib/convex-client';

function useConvexAuth() {
  const { data: session, status } = useSession();
  const fetchAccessToken = React.useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken?: boolean } = {}) => {
      if (status === 'loading') return null;
      if (!forceRefreshToken && session?.convexToken) {
        return session.convexToken;
      }
      const refreshed = await getSessionClient();
      if (!refreshed?.convexToken) {
        console.error('Missing convexToken in session. Check auth callbacks and env config.');
      }
      return refreshed?.convexToken ?? null;
    },
    [session, status],
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
