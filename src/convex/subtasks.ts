import { v } from 'convex/values';

import { type Id } from './_generated/dataModel';
import {
  type MutationCtx as MutationContext,
  type QueryCtx as QueryContext,
  mutation,
  query,
} from './_generated/server';
import { getNextOrder } from './lib/utilities';

export const list = query({
  args: { taskId: v.id('tasks') },
  handler: async (context: QueryContext, arguments_: { taskId: Id<'tasks'> }) => {
    return await context.db
      .query('subtasks')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FilterBuilder type complex to import
      .withIndex('by_task', (q: any) => q.eq('taskId', arguments_.taskId))
      .collect(); // Order by creation/order if needed
  },
});

export const create = mutation({
  args: {
    taskId: v.id('tasks'),
    title: v.string(),
  },
  handler: async (context: MutationContext, arguments_: { taskId: Id<'tasks'>; title: string }) => {
    const existing = await context.db
      .query('subtasks')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FilterBuilder type complex to import
      .withIndex('by_task', (q: any) => q.eq('taskId', arguments_.taskId))
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
  handler: async (
    context: MutationContext,
    arguments_: { subtaskId: Id<'subtasks'>; completed: boolean },
  ) => {
    await context.db.patch(arguments_.subtaskId, { completed: arguments_.completed });
  },
});

export const remove = mutation({
  args: { subtaskId: v.id('subtasks') },
  handler: async (context: MutationContext, arguments_: { subtaskId: Id<'subtasks'> }) => {
    await context.db.delete(arguments_.subtaskId);
  },
});
