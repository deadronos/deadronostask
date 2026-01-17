import { v } from 'convex/values';

import { type Doc, type Id } from './_generated/dataModel';
import { type QueryCtx, type MutationCtx } from './_generated/server';
import { mutationWithUser, queryWithUser } from './lib/auth';
import { archiveWithCheck, getNextOrder } from './lib/utils';
import { checkOwnership, validateString } from './lib/validations';

// Helper to validate that labels belong to the user
async function validateLabels(
  ctx: QueryCtx | MutationCtx,
  labelIds: Id<'labels'>[],
  clerkUserId: string,
) {
  const uniqueLabelIds = [...new Set(labelIds)];
  const labels = await Promise.all(uniqueLabelIds.map(id => ctx.db.get(id)));
  for (const label of labels) {
    if (!label) throw new Error('Label not found');
    if (label.ownerClerkUserId !== clerkUserId) throw new Error('Unauthorized label');
  }
  return uniqueLabelIds;
}

// Helper to sync labels for a task
async function syncLabels(
  ctx: QueryCtx | MutationCtx,
  taskId: Id<'tasks'>,
  labelIds: Id<'labels'>[],
) {
  const existing: Doc<'taskLabels'>[] = await ctx.db
    .query('taskLabels')
    .withIndex('by_task', q => q.eq('taskId', taskId))
    .collect();

  const existingIds = new Set(existing.map(e => e.labelId));
  const newIds = new Set(labelIds);

  // Delete removed
  for (const record of existing) {
    if (!newIds.has(record.labelId)) {
      await ctx.db.delete(record._id);
    }
  }

  // Add new
  for (const id of labelIds) {
    if (!existingIds.has(id)) {
      await ctx.db.insert('taskLabels', {
        taskId,
        labelId: id,
      });
    }
  }
}

/**
 * List tasks with optional filters
 */
export const list = queryWithUser({
  args: {
    projectId: v.optional(v.union(v.id('projects'), v.null())),
    status: v.optional(v.union(v.literal('todo'), v.literal('doing'), v.literal('done'))),
    search: v.optional(v.string()),
    includeArchived: v.optional(v.boolean()),
    labelIds: v.optional(v.array(v.id('labels'))),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = ctx;
    const includeArchived = args.includeArchived ?? false;

    let tasks: Doc<'tasks'>[];

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

    // Filter by labels (OR logic: task must have at least one of the provided labels)
    if (args.labelIds && args.labelIds.length > 0) {
      const taskIdsWithLabels = new Set<Id<'tasks'>>();

      // Fetch taskLabels for each requested label
      for (const labelId of args.labelIds) {
        const entries: Doc<'taskLabels'>[] = await ctx.db
          .query('taskLabels')
          .withIndex('by_label', q => q.eq('labelId', labelId))
          .collect();
        for (const entry of entries) {
          taskIdsWithLabels.add(entry.taskId);
        }
      }

      tasks = tasks.filter(task => taskIdsWithLabels.has(task._id));
    }

    // Attach labelIds to tasks
    const tasksWithLabels = await Promise.all(
      tasks.map(async task => {
        const taskLabels: Doc<'taskLabels'>[] = await ctx.db
          .query('taskLabels')
          .withIndex('by_task', q => q.eq('taskId', task._id))
          .collect();

        return {
          ...task,
          labelIds: taskLabels.map(tl => tl.labelId),
        };
      }),
    );

    // Sort by order, then creation time
    return tasksWithLabels.sort((a, b) => {
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
    labelIds: v.optional(v.array(v.id('labels'))),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = ctx;

    const title = validateString(args.title, 'Task title', 200);

    // Validate project ownership if projectId provided
    if (args.projectId) {
      await checkOwnership(ctx, args.projectId, clerkUserId, 'Project not found');
    }

    if (args.labelIds) {
      await validateLabels(ctx, args.labelIds, clerkUserId);
    }

    // Get max order for new task
    const allTasks: Doc<'tasks'>[] = await ctx.db
      .query('tasks')
      .withIndex('by_owner', q => q.eq('ownerClerkUserId', clerkUserId))
      .collect();
    const order = getNextOrder(allTasks, 1);

    const now = Date.now();

    const taskId = await ctx.db.insert('tasks', {
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

    if (args.labelIds && args.labelIds.length > 0) {
      const uniqueIds = [...new Set(args.labelIds)];
      for (const labelId of uniqueIds) {
        await ctx.db.insert('taskLabels', {
          taskId,
          labelId,
        });
      }
    }

    return taskId;
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

    if (args.labelIds) {
      await validateLabels(ctx, args.labelIds, clerkUserId);
    }

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
      await syncLabels(ctx, args.taskId, args.labelIds);
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
