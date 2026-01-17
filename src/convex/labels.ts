import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const list = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('labels')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect();
  },
});

export const create = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('labels', {
      projectId: args.projectId,
      name: args.name,
      color: args.color,
    });
  },
});

export const deleteLabel = mutation({
  args: { labelId: v.id('labels') },
  handler: async (ctx, args) => {
    // Optional: Cleanup references in tasks?
    // For now we'll just delete the label to keep it simple,
    // UI can handle missing labels gracefully.
    await ctx.db.delete(args.labelId);
  },
});
