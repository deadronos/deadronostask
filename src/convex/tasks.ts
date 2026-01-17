import { v } from 'convex/values';

import { mutationWithUser, queryWithUser } from './lib/auth';
import { archiveWithCheck, getNextOrder } from './lib/utils';
import { checkOwnership, validateString } from './lib/validations';

/**
 * List tasks with optional filters
 */
export const list = queryWithUser({
  args: {
    projectId: v.optional(v.union(v.id('projects'), v.null())),
    status: v.optional(v.union(v.literal('todo'), v.literal('doing'), v.literal('done'))),
    search: v.optional(v.string()),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = ctx;
    const includeArchived = args.includeArchived ?? false;

    let tasks;

    // Use appropriate index based on filters
    if (args.projectId !== undefined) {
      tasks = await ctx.db
        .query('tasks')
        .withIndex('by_owner_project', q =>
          q.eq('ownerClerkUserId', clerkUserId).eq('projectId', args.projectId),
        )
        .collect();
    } else if (args.status !== undefined) {
      const status = args.status as 'todo' | 'doing' | 'done';
      tasks = await ctx.db
        .query('tasks')
        .withIndex('by_owner_status', q =>
          q.eq('ownerClerkUserId', clerkUserId).eq('status', status),
        )
        .collect();
    } else {
      tasks = await ctx.db
        .query('tasks')
        .withIndex('by_owner', q => q.eq('ownerClerkUserId', clerkUserId))
        .collect();
    }

    // Filter archived
    if (!includeArchived) {
      tasks = tasks.filter(task => !task.archived);
    }

    // Filter by search
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      tasks = tasks.filter(
        task =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower),
      );
    }

    // Sort by order, then creation time
    return tasks.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return b.createdAt - a.createdAt;
    });
  },
});

/**
 * Create a new task
 */
export const create = mutationWithUser({
  args: {
    projectId: v.optional(v.union(v.id('projects'), v.null())),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal(0), v.literal(1), v.literal(2), v.literal(3))),
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = ctx;

    const title = validateString(args.title, 'Task title', 200);

    // Validate project ownership if projectId provided
    if (args.projectId) {
      await checkOwnership(ctx, args.projectId, clerkUserId, 'Project not found');
    }

    // Get max order for new task
    const allTasks = await ctx.db
      .query('tasks')
      .withIndex('by_owner', q => q.eq('ownerClerkUserId', clerkUserId))
      .collect();
    const order = getNextOrder(allTasks, 1);

    const now = Date.now();

    return await ctx.db.insert('tasks', {
      ownerClerkUserId: clerkUserId,
      projectId: args.projectId,
      title,
      description: args.description?.trim(),
      status: 'todo',
      priority: args.priority ?? 0,
      dueAt: args.dueAt,
      order,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a task
 */
export const update = mutationWithUser({
  args: {
    taskId: v.id('tasks'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal(0), v.literal(1), v.literal(2), v.literal(3))),
    dueAt: v.optional(v.union(v.number(), v.null())),
    labelIds: v.optional(v.array(v.id('labels'))),
    projectId: v.optional(v.union(v.id('projects'), v.null())),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = ctx;

    await checkOwnership(ctx, args.taskId, clerkUserId, 'Task not found');

    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.title !== undefined) {
      patch.title = validateString(args.title, 'Task title', 200);
    }

    if (args.description !== undefined) {
      patch.description = args.description?.trim();
    }

    if (args.priority !== undefined) {
      patch.priority = args.priority;
    }

    if (args.dueAt !== undefined) {
      patch.dueAt = args.dueAt;
    }

    if (args.labelIds !== undefined) {
      patch.labelIds = args.labelIds;
    }

    if (args.projectId !== undefined) {
      // Validate project ownership if projectId provided
      if (args.projectId) {
        await checkOwnership(ctx, args.projectId, clerkUserId, 'Project not found');
      }
      patch.projectId = args.projectId;
    }

    await ctx.db.patch(args.taskId, patch);
  },
});

/**
 * Set task status
 */
export const setStatus = mutationWithUser({
  args: {
    taskId: v.id('tasks'),
    status: v.union(v.literal('todo'), v.literal('doing'), v.literal('done')),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = ctx;

    await checkOwnership(ctx, args.taskId, clerkUserId, 'Task not found');

    await ctx.db.patch(args.taskId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Reorder a task
 */
export const reorder = mutationWithUser({
  args: {
    taskId: v.id('tasks'),
    order: v.number(),
    status: v.optional(v.union(v.literal('todo'), v.literal('doing'), v.literal('done'))),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = ctx;

    await checkOwnership(ctx, args.taskId, clerkUserId, 'Task not found');

    const patch: Record<string, unknown> = {
      order: args.order,
      updatedAt: Date.now(),
    };

    if (args.status !== undefined) {
      patch.status = args.status;
    }

    await ctx.db.patch(args.taskId, patch);
  },
});

/**
 * Archive a task
 */
export const archive = mutationWithUser({
  args: {
    taskId: v.id('tasks'),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = ctx;

    await archiveWithCheck(ctx, args.taskId, clerkUserId, 'Task not found');
  },
});
