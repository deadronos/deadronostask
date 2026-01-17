import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { getNextOrder } from './lib/utilities';

export const list = query({
  args: { taskId: v.id('tasks') },
  handler: async (context, arguments_) => {
    return await context.db
      .query('subtasks')
      .withIndex('by_task', q => q.eq('taskId', arguments_.taskId))
      .collect(); // Order by creation/order if needed
  },
});

export const create = mutation({
  args: {
    taskId: v.id('tasks'),
    title: v.string(),
  },
  handler: async (context, arguments_) => {
    const existing = await context.db
      .query('subtasks')
      .withIndex('by_task', q => q.eq('taskId', arguments_.taskId))
      .collect();

    // Simple order: append to end
    const order = getNextOrder(existing, 0);

    return await context.db.insert('subtasks', {
      taskId: arguments_.taskId,
      title: arguments_.title,
      completed: false,
      order,
    });
  },
});

export const toggle = mutation({
  args: { subtaskId: v.id('subtasks'), completed: v.boolean() },
  handler: async (context, arguments_) => {
    await context.db.patch(arguments_.subtaskId, { completed: arguments_.completed });
  },
});

export const remove = mutation({
  args: { subtaskId: v.id('subtasks') },
  handler: async (context, arguments_) => {
    await context.db.delete(arguments_.subtaskId);
  },
});
