import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireUserId } from './lib/auth';

/**
 * List all projects for the current user
 */
export const list = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUserId(ctx);
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
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUserId(ctx);

    const name = args.name.trim();
    if (!name) {
      throw new Error('Project name is required');
    }
    if (name.length > 100) {
      throw new Error('Project name must be 100 characters or less');
    }

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
export const update = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUserId(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    if (project.ownerClerkUserId !== clerkUserId) {
      throw new Error('Unauthorized');
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.name !== undefined) {
      const name = args.name.trim();
      if (!name) {
        throw new Error('Project name is required');
      }
      if (name.length > 100) {
        throw new Error('Project name must be 100 characters or less');
      }
      patch.name = name;
    }

    await ctx.db.patch(args.projectId, patch);
  },
});

/**
 * Archive a project
 */
export const archive = mutation({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUserId(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    if (project.ownerClerkUserId !== clerkUserId) {
      throw new Error('Unauthorized');
    }

    await ctx.db.patch(args.projectId, {
      archived: true,
      updatedAt: Date.now(),
    });
  },
});
