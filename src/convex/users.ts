import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
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
  handler: async (ctx, args) => {
    const clerkUserId = await requireUserId(ctx);

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id', q => q.eq('clerkUserId', clerkUserId))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert('users', {
        clerkUserId,
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
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
  handler: async ctx => {
    const clerkUserId = await requireUserId(ctx);

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id', q => q.eq('clerkUserId', clerkUserId))
      .unique();

    return user;
  },
});
