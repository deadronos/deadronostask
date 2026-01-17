import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireUserId } from './lib/auth';

/**
 * List tasks with optional filters
 */
export const list = query({
  args: {
    projectId: v.optional(v.union(v.id('projects'), v.null())),
    status: v.optional(v.union(v.literal('todo'), v.literal('doing'), v.literal('done'))),
    search: v.optional(v.string()),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUserId(ctx);
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
export const create = mutation({
  args: {
    projectId: v.optional(v.union(v.id('projects'), v.null())),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal(0), v.literal(1), v.literal(2), v.literal(3))),
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUserId(ctx);

    const title = args.title.trim();
    if (!title) {
      throw new Error('Task title is required');
    }
    if (title.length > 200) {
      throw new Error('Task title must be 200 characters or less');
    }

    // Validate project ownership if projectId provided
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      if (project.ownerClerkUserId !== clerkUserId) {
        throw new Error('Unauthorized');
      }
    }

    // Get max order for new task
    const allTasks = await ctx.db
      .query('tasks')
      .withIndex('by_owner', q => q.eq('ownerClerkUserId', clerkUserId))
      .collect();
    const maxOrder = allTasks.reduce((max, task) => Math.max(max, task.order), 0);

    const now = Date.now();

    return await ctx.db.insert('tasks', {
      ownerClerkUserId: clerkUserId,
      projectId: args.projectId,
      title,
      description: args.description?.trim(),
      status: 'todo',
      priority: args.priority ?? 0,
      dueAt: args.dueAt,
      order: maxOrder + 1,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a task
 */
export const update = mutation({
  args: {
    taskId: v.id('tasks'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal(0), v.literal(1), v.literal(2), v.literal(3))),
    dueAt: v.optional(v.union(v.number(), v.null())),
    projectId: v.optional(v.union(v.id('projects'), v.null())),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUserId(ctx);

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    if (task.ownerClerkUserId !== clerkUserId) {
      throw new Error('Unauthorized');
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.title !== undefined) {
      const title = args.title.trim();
      if (!title) {
        throw new Error('Task title is required');
      }
      if (title.length > 200) {
        throw new Error('Task title must be 200 characters or less');
      }
      patch.title = title;
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

    if (args.projectId !== undefined) {
      // Validate project ownership if projectId provided
      if (args.projectId) {
        const project = await ctx.db.get(args.projectId);
        if (!project) {
          throw new Error('Project not found');
        }
        if (project.ownerClerkUserId !== clerkUserId) {
          throw new Error('Unauthorized');
        }
      }
      patch.projectId = args.projectId;
    }

    await ctx.db.patch(args.taskId, patch);
  },
});

/**
 * Set task status
 */
export const setStatus = mutation({
  args: {
    taskId: v.id('tasks'),
    status: v.union(v.literal('todo'), v.literal('doing'), v.literal('done')),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUserId(ctx);

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    if (task.ownerClerkUserId !== clerkUserId) {
      throw new Error('Unauthorized');
    }

    await ctx.db.patch(args.taskId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Reorder a task
 */
export const reorder = mutation({
  args: {
    taskId: v.id('tasks'),
    order: v.number(),
    status: v.optional(v.union(v.literal('todo'), v.literal('doing'), v.literal('done'))),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUserId(ctx);

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    if (task.ownerClerkUserId !== clerkUserId) {
      throw new Error('Unauthorized');
    }

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
export const archive = mutation({
  args: {
    taskId: v.id('tasks'),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUserId(ctx);

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    if (task.ownerClerkUserId !== clerkUserId) {
      throw new Error('Unauthorized');
    }

    await ctx.db.patch(args.taskId, {
      archived: true,
      updatedAt: Date.now(),
    });
  },
});
