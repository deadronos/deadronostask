import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { assertOwned, requireUserId } from './lib/auth';

export const list = query({
  args: {},
  handler: async ctx => {
    const ownerId = await requireUserId(ctx);
    return ctx.db
      .query('labels')
      .withIndex('by_owner_name', q => q.eq('ownerId', ownerId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const now = Date.now();
    const id = await ctx.db.insert('labels', {
      ownerId,
      name: args.name,
      color: args.color,
      createdAt: now,
      updatedAt: now,
    });
    return ctx.db.get(id);
  },
});

export const rename = mutation({
  args: {
    id: v.id('labels'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const label = await ctx.db.get(args.id);
    assertOwned(label, ownerId);
    await ctx.db.patch(args.id, { name: args.name, updatedAt: Date.now() });
    return args.id;
  },
});

export const remove = mutation({
  args: {
    id: v.id('labels'),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const label = await ctx.db.get(args.id);
    assertOwned(label, ownerId);

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_owner_updatedAt', q => q.eq('ownerId', ownerId))
      .collect();

    const updates = tasks
      .filter(task => task.labelIds.includes(args.id))
      .map(task =>
        ctx.db.patch(task._id, {
          labelIds: task.labelIds.filter(id => id !== args.id),
          updatedAt: Date.now(),
        }),
      );

    await Promise.all(updates);
    await ctx.db.delete(args.id);
    return true;
  },
});
