import { customCtx, customMutation, customQuery } from 'convex-helpers/server/customFunctions';

import {
  mutation,
  query,
  type QueryCtx as QueryContext,
  type MutationCtx as MutationContext,
} from '../_generated/server';

export type UserQueryContext = QueryContext & { clerkUserId: string };
export type UserMutationContext = MutationContext & { clerkUserId: string };

export async function getUserIdentity(context: QueryContext | MutationContext) {
  const identity = await context.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Unauthenticated');
  }
  return identity;
}

export async function requireUserId(context: QueryContext | MutationContext) {
  const identity = await getUserIdentity(context);
  return identity.subject;
}

export const queryWithUser = customQuery(
  query,
  customCtx(async (context: QueryContext) => {
    const clerkUserId = await requireUserId(context);
    return { clerkUserId };
  }),
);

export const mutationWithUser = customMutation(
  mutation,
  customCtx(async (context: MutationContext) => {
    const clerkUserId = await requireUserId(context);
    return { clerkUserId };
  }),
);
