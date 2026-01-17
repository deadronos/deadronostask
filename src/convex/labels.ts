import { v } from 'convex/values';

import { mutationWithUser, queryWithUser } from './lib/auth';

export const list = queryWithUser({
  args: {},
  handler: async context => {
    return await context.db
      .query('labels')
      .withIndex('by_owner', q => q.eq('ownerClerkUserId', context.clerkUserId))
      .collect();
  },
});

export const create = mutationWithUser({
  args: {
    name: v.string(),
    color: v.string(),
  },
  handler: async (context, arguments_) => {
    return await context.db.insert('labels', {
      ownerClerkUserId: context.clerkUserId,
      name: arguments_.name,
      color: arguments_.color,
    });
  },
});

export const deleteLabel = mutationWithUser({
  args: { labelId: v.id('labels') },
  handler: async (context, arguments_) => {
    const { clerkUserId } = context;
    const label = await context.db.get(arguments_.labelId);

    if (!label) return;

    if (label.ownerClerkUserId !== clerkUserId) {
      throw new Error('Unauthorized');
    }

    // Delete associations in taskLabels
    const associations = await context.db
      .query('taskLabels')
      .withIndex('by_label', q => q.eq('labelId', arguments_.labelId))
      .collect();

    for (const assoc of associations) {
      await context.db.delete(assoc._id);
    }

    await context.db.delete(arguments_.labelId);
  },
});
