import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { getNextOrder } from './lib/utils';

export const list = query({
  args: { taskId: v.id('tasks') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('subtasks')
      .withIndex('by_task', q => q.eq('taskId', args.taskId))
      .collect(); // Order by creation/order if needed
  },
});

export const create = mutation({
  args: {
    taskId: v.id('tasks'),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('subtasks')
      .withIndex('by_task', q => q.eq('taskId', args.taskId))
      .collect();

    // Simple order: append to end
    const order = getNextOrder(existing, 0);

    return await ctx.db.insert('subtasks', {
      taskId: args.taskId,
      title: args.title,
      completed: false,
      order,
    });
  },
});

export const toggle = mutation({
  args: { subtaskId: v.id('subtasks'), completed: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subtaskId, { completed: args.completed });
  },
});

export const remove = mutation({
  args: { subtaskId: v.id('subtasks') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.subtaskId);
  },
});
