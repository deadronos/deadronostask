import { v } from 'convex/values';

import { type Doc as Document_, type Id } from './_generated/dataModel';
import {
  type QueryCtx as QueryContext,
  type MutationCtx as MutationContext,
} from './_generated/server';
import { mutationWithUser, queryWithUser } from './lib/auth';
import { archiveWithCheck, getNextOrder } from './lib/utilities';
import { checkOwnership, validateString } from './lib/validations';

// Helper to validate that labels belong to the user
async function validateLabels(
  context: QueryContext,
  labelIds: Id<'labels'>[],
  clerkUserId: string,
) {
  const uniqueLabelIds = [...new Set(labelIds)];
  const labels = await Promise.all(uniqueLabelIds.map(id => context.db.get(id)));
  for (const label of labels) {
    if (!label) throw new Error('Label not found');
    if (label.ownerClerkUserId !== clerkUserId) throw new Error('Unauthorized label');
  }
  return uniqueLabelIds;
}

// Helper to sync labels for a task
async function syncLabels(context: MutationContext, taskId: Id<'tasks'>, labelIds: Id<'labels'>[]) {
  const existing: Document_<'taskLabels'>[] = await context.db
    .query('taskLabels')
    .withIndex('by_task', q => q.eq('taskId', taskId))
    .collect();

  const existingIds = new Set(existing.map(taskLabel => taskLabel.labelId));
  const newIds = new Set(labelIds);

  // Delete removed
  for (const record of existing) {
    if (!newIds.has(record.labelId)) {
      await context.db.delete(record._id);
    }
  }

  // Add new
  for (const id of labelIds) {
    if (!existingIds.has(id)) {
      await context.db.insert('taskLabels', {
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
  handler: async (context, arguments_) => {
    const { clerkUserId } = context;
    const includeArchived = arguments_.includeArchived ?? false;

    let tasks: Document_<'tasks'>[];

    // Use appropriate index based on filters
    if (arguments_.projectId !== undefined) {
      tasks = await context.db
        .query('tasks')
        .withIndex('by_owner_project', q =>
          q.eq('ownerClerkUserId', clerkUserId).eq('projectId', arguments_.projectId),
        )
        .collect();
    } else if (arguments_.status === undefined) {
      tasks = await context.db
        .query('tasks')
        .withIndex('by_owner', q => q.eq('ownerClerkUserId', clerkUserId))
        .collect();
    } else {
      const status = arguments_.status;
      tasks = await context.db
        .query('tasks')
        .withIndex('by_owner_status', q =>
          q.eq('ownerClerkUserId', clerkUserId).eq('status', status),
        )
        .collect();
    }

    // Filter archived
    if (!includeArchived) {
      tasks = tasks.filter(task => !task.archived);
    }

    // Filter by search
    if (arguments_.search) {
      const searchLower = arguments_.search.toLowerCase();
      tasks = tasks.filter(
        task =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower),
      );
    }

    // Filter by labels (OR logic: task must have at least one of the provided labels)
    if (arguments_.labelIds && arguments_.labelIds.length > 0) {
      const taskIdsWithLabels = new Set<Id<'tasks'>>();

      // Fetch taskLabels for each requested label
      for (const labelId of arguments_.labelIds) {
        const entries: Document_<'taskLabels'>[] = await context.db
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
        const taskLabels: Document_<'taskLabels'>[] = await context.db
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
    return tasksWithLabels.toSorted((a, b) => {
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
  handler: async (context, arguments_) => {
    const { clerkUserId } = context;

    const title = validateString(arguments_.title, 'Task title', 200);

    // Validate project ownership if projectId provided
    if (arguments_.projectId) {
      await checkOwnership(context, arguments_.projectId, clerkUserId, 'Project not found');
    }

    if (arguments_.labelIds) {
      await validateLabels(context, arguments_.labelIds, clerkUserId);
    }

    // Get max order for new task
    const allTasks: Document_<'tasks'>[] = await context.db
      .query('tasks')
      .withIndex('by_owner', q => q.eq('ownerClerkUserId', clerkUserId))
      .collect();
    const order = getNextOrder(allTasks, 1);

    const now = Date.now();

    const taskId = await context.db.insert('tasks', {
      ownerClerkUserId: clerkUserId,
      projectId: arguments_.projectId,
      title,
      description: arguments_.description?.trim(),
      status: 'todo',
      priority: arguments_.priority ?? 0,
      dueAt: arguments_.dueAt,
      order,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });

    if (arguments_.labelIds && arguments_.labelIds.length > 0) {
      const uniqueIds = [...new Set(arguments_.labelIds)];
      for (const labelId of uniqueIds) {
        await context.db.insert('taskLabels', {
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
  handler: async (context, arguments_) => {
    const { clerkUserId } = context;

    await checkOwnership(context, arguments_.taskId, clerkUserId, 'Task not found');

    if (arguments_.labelIds) {
      await validateLabels(context, arguments_.labelIds, clerkUserId);
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (arguments_.title !== undefined) {
      patch.title = validateString(arguments_.title, 'Task title', 200);
    }

    if (arguments_.description !== undefined) {
      patch.description = arguments_.description?.trim();
    }

    if (arguments_.priority !== undefined) {
      patch.priority = arguments_.priority;
    }

    if (arguments_.dueAt !== undefined) {
      patch.dueAt = arguments_.dueAt;
    }

    if (arguments_.labelIds !== undefined) {
      await syncLabels(context, arguments_.taskId, arguments_.labelIds);
    }

    if (arguments_.projectId !== undefined) {
      // Validate project ownership if projectId provided
      if (arguments_.projectId) {
        await checkOwnership(context, arguments_.projectId, clerkUserId, 'Project not found');
      }
      patch.projectId = arguments_.projectId;
    }

    await context.db.patch(arguments_.taskId, patch);
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
  handler: async (context, arguments_) => {
    const { clerkUserId } = context;

    await checkOwnership(context, arguments_.taskId, clerkUserId, 'Task not found');

    await context.db.patch(arguments_.taskId, {
      status: arguments_.status,
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
  handler: async (context, arguments_) => {
    const { clerkUserId } = context;

    await checkOwnership(context, arguments_.taskId, clerkUserId, 'Task not found');

    const patch: Record<string, unknown> = {
      order: arguments_.order,
      updatedAt: Date.now(),
    };

    if (arguments_.status !== undefined) {
      patch.status = arguments_.status;
    }

    await context.db.patch(arguments_.taskId, patch);
  },
});

/**
 * Archive a task
 */
export const archive = mutationWithUser({
  args: {
    taskId: v.id('tasks'),
  },
  handler: async (context, arguments_) => {
    const { clerkUserId } = context;

    await archiveWithCheck(context, arguments_.taskId, clerkUserId, 'Task not found');
  },
});
