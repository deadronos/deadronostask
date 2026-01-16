import { customCtx, customMutation, customQuery } from 'convex-helpers/server/customFunctions';

import { mutation, query, type QueryCtx, type MutationCtx } from '../_generated/server';

export async function getUserIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Unauthenticated');
  }
  return identity;
}

export async function requireUserId(ctx: QueryCtx | MutationCtx) {
  const identity = await getUserIdentity(ctx);
  return identity.subject;
}

export const queryWithUser = customQuery(
  query,
  customCtx(async ctx => {
    const clerkUserId = await requireUserId(ctx);
    return { clerkUserId };
  }),
);

export const mutationWithUser = customMutation(
  mutation,
  customCtx(async ctx => {
    const clerkUserId = await requireUserId(ctx);
    return { clerkUserId };
  }),
);
