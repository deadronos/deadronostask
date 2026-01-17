import { v } from 'convex/values';
import { mutationWithUser, queryWithUser } from './lib/auth';

export const list = queryWithUser({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('labels')
      .withIndex('by_owner', q => q.eq('ownerClerkUserId', ctx.clerkUserId))
      .collect();
  },
});

export const create = mutationWithUser({
  args: {
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('labels', {
      ownerClerkUserId: ctx.clerkUserId,
      name: args.name,
      color: args.color,
    });
  },
});

export const deleteLabel = mutationWithUser({
  args: { labelId: v.id('labels') },
  handler: async (ctx, args) => {
    const { clerkUserId } = ctx;
    const label = await ctx.db.get(args.labelId);

    if (!label) return;

    if (label.ownerClerkUserId !== clerkUserId) {
      throw new Error("Unauthorized");
    }

    // Delete associations in taskLabels
    const associations = await ctx.db
      .query('taskLabels')
      .withIndex('by_label', q => q.eq('labelId', args.labelId))
      .collect();

    for (const assoc of associations) {
      await ctx.db.delete(assoc._id);
    }

    await ctx.db.delete(args.labelId);
  },
});
