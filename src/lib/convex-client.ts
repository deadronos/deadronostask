'use client';

import {
  ConvexProviderWithAuth,
  ConvexReactClient,
  useConvexAuth,
  useMutation,
  useQuery as useConvexQuery,
} from 'convex/react';
import type { FunctionReference } from 'convex/server';

type EmptyObject = Record<string, never>;

export { ConvexProviderWithAuth, ConvexReactClient, useMutation, useConvexAuth };

type OptionalRestArgsOrSkip<FuncRef extends FunctionReference<'query'>> =
  FuncRef['_args'] extends EmptyObject
    ? [args?: EmptyObject | 'skip']
    : [args: FuncRef['_args'] | 'skip'];

export function useQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  ...args: OptionalRestArgsOrSkip<Query>
): Query['_returnType'] | undefined {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const queryArgs = args[0];
  const shouldSkip = queryArgs === 'skip' || isLoading || !isAuthenticated;
  const effectiveArgs = (shouldSkip ? ['skip'] : args) as OptionalRestArgsOrSkip<Query>;
  return useConvexQuery(query, ...effectiveArgs);
}
