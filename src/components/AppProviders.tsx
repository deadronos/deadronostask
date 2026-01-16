'use client';

import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { SessionProvider, useSession } from 'next-auth/react';
import * as React from 'react';

import type { Session } from '@/auth/types';

function useConvexAuth() {
  const { data: session, status, update } = useSession();
  const hasUserId = Boolean(session?.userId);
  const hasToken = Boolean(session?.convexToken);
  const fetchAccessToken = React.useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken?: boolean } = {}) => {
      if (!hasUserId) {
        return null;
      }
      if (forceRefreshToken || !hasToken) {
        const refreshed = await update();
        if (!refreshed?.convexToken) {
          console.error('Missing convexToken in session. Check auth callbacks and env config.');
        }
        return refreshed?.convexToken ?? null;
      }
      return session?.convexToken ?? null;
    },
    [hasToken, hasUserId, session?.convexToken, update],
  );

  return {
    isLoading: status === 'loading' && !hasUserId,
    isAuthenticated: hasUserId && hasToken,
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
