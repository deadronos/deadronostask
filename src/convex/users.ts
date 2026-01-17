import { v } from 'convex/values';

import {
  type MutationCtx as MutationContext,
  type QueryCtx as QueryContext,
  mutation,
  query,
} from './_generated/server';
import { requireUserId } from './lib/auth';

/**
 * Upsert the current user based on Clerk identity
 */
export const upsertMe = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (
    context: MutationContext,
    arguments_: { email?: string; name?: string; avatarUrl?: string },
  ) => {
    const clerkUserId = await requireUserId(context);

    const existing = await context.db
      .query('users')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FilterBuilder type complex to import
      .withIndex('by_clerk_user_id', (q: any) => q.eq('clerkUserId', clerkUserId))
      .unique();

    const now = Date.now();

    if (existing) {
      await context.db.patch(existing._id, {
        email: arguments_.email,
        name: arguments_.name,
        avatarUrl: arguments_.avatarUrl,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await context.db.insert('users', {
        clerkUserId,
        email: arguments_.email,
        name: arguments_.name,
        avatarUrl: arguments_.avatarUrl,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * Get the current user
 */
export const getMe = query({
  args: {},
  handler: async (context: QueryContext) => {
    const clerkUserId = await requireUserId(context);

    const user = await context.db
      .query('users')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FilterBuilder type complex to import
      .withIndex('by_clerk_user_id', (q: any) => q.eq('clerkUserId', clerkUserId))
      .unique();

    return user;
  },
});
