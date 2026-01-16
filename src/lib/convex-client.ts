'use client';

import {
  ConvexProviderWithAuth,
  ConvexReactClient,
  useConvexAuth,
  useMutation,
  useQuery as useConvexQuery,
} from 'convex/react';

export { ConvexProviderWithAuth, ConvexReactClient, useMutation, useConvexAuth };

export function useQuery(...args: Parameters<typeof useConvexQuery>) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [query, queryArgs] = args;
  const shouldSkip = queryArgs === 'skip' || isLoading || !isAuthenticated;
  const effectiveArgs = shouldSkip ? 'skip' : queryArgs;
  return useConvexQuery(query as never, effectiveArgs as never);
}
