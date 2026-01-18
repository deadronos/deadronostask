import { v } from 'convex/values';

import { type Id } from './_generated/dataModel';
import {
  type UserMutationContext,
  type UserQueryContext,
  mutationWithUser,
  queryWithUser,
} from './lib/auth';
import { checkOwnership } from './lib/validations';

export const list = queryWithUser({
  args: {},
  handler: async (context: UserQueryContext) => {
    return await context.db
      .query('labels')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FilterBuilder type complex to import
      .withIndex('by_owner', (q: any) => q.eq('ownerClerkUserId', context.clerkUserId))
      .collect();
  },
});

export const create = mutationWithUser({
  args: {
    name: v.string(),
    color: v.string(),
  },
  handler: async (context: UserMutationContext, arguments_: { name: string; color: string }) => {
    return await context.db.insert('labels', {
      ownerClerkUserId: context.clerkUserId,
      name: arguments_.name,
      color: arguments_.color,
    });
  },
});

export const deleteLabel = mutationWithUser({
  args: { labelId: v.id('labels') },
  handler: async (context: UserMutationContext, arguments_: { labelId: Id<'labels'> }) => {
    const { clerkUserId } = context;

    await checkOwnership(context, arguments_.labelId, clerkUserId, 'Label not found');

    // Delete associations in taskLabels
    const associations = await context.db
      .query('taskLabels')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FilterBuilder type complex to import
      .withIndex('by_label', (q: any) => q.eq('labelId', arguments_.labelId))
      .collect();

    for (const assoc of associations) {
      await context.db.delete(assoc._id);
    }

    await context.db.delete(arguments_.labelId);
  },
});
