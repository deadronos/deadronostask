import { v } from 'convex/values';

import { mutationWithUser, queryWithUser } from './lib/auth';
import { checkOwnership, validateString } from './lib/validations';

/**
 * List all projects for the current user
 */
export const list = queryWithUser({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = ctx;
    const includeArchived = args.includeArchived ?? false;

    if (includeArchived) {
      return await ctx.db
        .query('projects')
        .withIndex('by_owner', q => q.eq('ownerClerkUserId', clerkUserId))
        .order('desc')
        .collect();
    } else {
      return await ctx.db
        .query('projects')
        .withIndex('by_owner_archived', q =>
          q.eq('ownerClerkUserId', clerkUserId).eq('archived', false),
        )
        .order('desc')
        .collect();
    }
  },
});

/**
 * Create a new project
 */
export const create = mutationWithUser({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = ctx;

    const name = validateString(args.name, 'Project name', 100);

    const now = Date.now();

    return await ctx.db.insert('projects', {
      ownerClerkUserId: clerkUserId,
      name,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a project
 */
export const update = mutationWithUser({
  args: {
    projectId: v.id('projects'),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = ctx;

    await checkOwnership(ctx, args.projectId, clerkUserId, 'Project not found');

    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.name !== undefined) {
      patch.name = validateString(args.name, 'Project name', 100);
    }

    await ctx.db.patch(args.projectId, patch);
  },
});

/**
 * Archive a project
 */
export const archive = mutationWithUser({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = ctx;

    await checkOwnership(ctx, args.projectId, clerkUserId, 'Project not found');

    await ctx.db.patch(args.projectId, {
      archived: true,
      updatedAt: Date.now(),
    });
  },
});
