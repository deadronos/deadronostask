import { v } from 'convex/values';

import { type Doc as Document_, type Id } from './_generated/dataModel';
import {
  type MutationCtx as MutationContext,
  type QueryCtx as QueryContext,
} from './_generated/server';
import {
  type UserMutationContext,
  type UserQueryContext,
  mutationWithUser,
  queryWithUser,
} from './lib/auth';
import { archiveWithCheck, getNextOrder } from './lib/utilities';
import { checkOwnership, validateString } from './lib/validations';

type TaskStatus = 'todo' | 'doing' | 'done';

// Helper to validate that labels belong to the user
async function validateLabels(
  context: QueryContext,
  labelIds: Id<'labels'>[],
  clerkUserId: string,
) {
  const uniqueLabelIds = [...new Set(labelIds)];
  const labels = await Promise.all(uniqueLabelIds.map((id: Id<'labels'>) => context.db.get(id)));
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FilterBuilder type complex to import
    .withIndex('by_task', (q: any) => q.eq('taskId', taskId))
    .collect();

  const existingIds = new Set(
    existing.map((taskLabel: Document_<'taskLabels'>) => taskLabel.labelId),
  );
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
  handler: async (
    context: UserQueryContext,
    arguments_: {
      projectId?: Id<'projects'> | null;
      status?: TaskStatus;
      search?: string;
      includeArchived?: boolean;
      labelIds?: Id<'labels'>[];
    },
  ) => {
    const { clerkUserId } = context;
    const includeArchived = arguments_.includeArchived ?? false;

    let tasks: Document_<'tasks'>[];

    // Use appropriate index based on filters
    if (arguments_.projectId !== undefined && arguments_.projectId !== null) {
      tasks = await context.db
        .query('tasks')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FilterBuilder type complex to import
        .withIndex('by_owner_project', (q: any) =>
          q.eq('ownerClerkUserId', clerkUserId).eq('projectId', arguments_.projectId),
        )
        .collect();
    } else if (arguments_.status === undefined) {
      tasks = await context.db
        .query('tasks')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FilterBuilder type complex to import
        .withIndex('by_owner', (q: any) => q.eq('ownerClerkUserId', clerkUserId))
        .collect();
    } else {
      tasks = await context.db
        .query('tasks')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FilterBuilder type complex to import
        .withIndex('by_owner_status', (q: any) =>
          q.eq('ownerClerkUserId', clerkUserId).eq('status', arguments_.status),
        )
        .collect();
    }

    let filteredTasks = tasks;

    // Filter archived
    if (!includeArchived) {
      filteredTasks = filteredTasks.filter((task: Document_<'tasks'>) => task.archived !== true);
    }

    // Filter by search
    if (arguments_.search !== undefined && arguments_.search !== '') {
      const searchLower = arguments_.search.toLowerCase();
      filteredTasks = filteredTasks.filter(
        (task: Document_<'tasks'>) =>
          (task.title ?? '').toLowerCase().includes(searchLower) === true ||
          (task.description ?? '').toLowerCase().includes(searchLower) === true,
      );
    }

    // Filter by labels (OR logic: task must have at least one of the provided labels)
    if (arguments_.labelIds && arguments_.labelIds.length > 0) {
      const taskIdsWithLabels = new Set<Id<'tasks'>>();

      // Fetch taskLabels for each requested label
      for (const labelId of arguments_.labelIds) {
        const entries: Document_<'taskLabels'>[] = await context.db
          .query('taskLabels')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FilterBuilder type complex to import
          .withIndex('by_label', (q: any) => q.eq('labelId', labelId))
          .collect();
        for (const entry of entries) {
          taskIdsWithLabels.add(entry.taskId);
        }
      }

      filteredTasks = filteredTasks.filter((task: Document_<'tasks'>) =>
        taskIdsWithLabels.has(task._id),
      );
    }

    // Attach labelIds to tasks
    const tasksWithLabels = await Promise.all(
      filteredTasks.map(async (task: Document_<'tasks'>) => {
        const taskLabels: Document_<'taskLabels'>[] = await context.db
          .query('taskLabels')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FilterBuilder type complex to import
          .withIndex('by_task', (q: any) => q.eq('taskId', task._id))
          .collect();

        return {
          ...task,
          labelIds: taskLabels.map((tl: Document_<'taskLabels'>) => tl.labelId),
        };
      }),
    );

    // Sort by order, then creation time
    // eslint-disable-next-line
    return [...tasksWithLabels].sort((a: any, b: any) => {
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
    projectId: v.optional(v.id('projects')),
    title: v.string(),
    description: v.optional(v.string()),
    labelIds: v.optional(v.array(v.id('labels'))),
    priority: v.optional(v.union(v.literal(0), v.literal(1), v.literal(2), v.literal(3))),
    dueDate: v.optional(v.number()),
  },
  handler: async (
    context: UserMutationContext,
    arguments_: {
      projectId?: Id<'projects'>;
      title: string;
      description?: string;
      labelIds?: Id<'labels'>[];
      priority?: 0 | 1 | 2 | 3;
      dueDate?: number;
    },
  ) => {
    const { clerkUserId } = context;

    if (arguments_.projectId) {
      await checkOwnership(context, arguments_.projectId, clerkUserId, 'Project not found');
    }

    if (arguments_.labelIds) {
      await validateLabels(context, arguments_.labelIds, clerkUserId);
    }

    // Get order
    const tasks: Document_<'tasks'>[] = arguments_.projectId
      ? await context.db
          .query('tasks')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FilterBuilder type complex to import
          .withIndex('by_owner_project', (q: any) =>
            q.eq('ownerClerkUserId', clerkUserId).eq('projectId', arguments_.projectId),
          )
          .collect()
      : await context.db
          .query('tasks')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FilterBuilder type complex to import
          .withIndex('by_owner', (q: any) => q.eq('ownerClerkUserId', clerkUserId))
          .collect();

    const order = getNextOrder(tasks, 1);

    const now = Date.now();

    const taskId = await context.db.insert('tasks', {
      ownerClerkUserId: clerkUserId,
      projectId: arguments_.projectId,
      title: arguments_.title,
      description: arguments_.description?.trim(),
      status: 'todo',
      priority: arguments_.priority ?? 0,
      dueAt: arguments_.dueDate,
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
 * Get a single task
 */
export const get = queryWithUser({
  args: { taskId: v.id('tasks') },
  handler: async (context: UserQueryContext, arguments_: { taskId: Id<'tasks'> }) => {
    const { clerkUserId } = context;
    const task = await context.db.get(arguments_.taskId);

    // eslint-disable-next-line
    if (!task) return null;

    if (task.ownerClerkUserId !== clerkUserId) {
      // Check shared logic here if implemented
      // eslint-disable-next-line
      return null;
    }

    const taskLabels: Document_<'taskLabels'>[] = await context.db
      .query('taskLabels')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FilterBuilder type complex to import
      .withIndex('by_task', (q: any) => q.eq('taskId', task._id))
      .collect();

    return {
      ...task,
      labelIds: taskLabels.map((tl: Document_<'taskLabels'>) => tl.labelId),
    };
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
    status: v.optional(v.union(v.literal('todo'), v.literal('doing'), v.literal('done'))),
    priority: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    projectId: v.optional(v.id('projects')),
    labelIds: v.optional(v.array(v.id('labels'))),
  },
  handler: async (
    context: UserMutationContext,
    arguments_: {
      taskId: Id<'tasks'>;
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: number;
      dueDate?: number;
      projectId?: Id<'projects'>;
      labelIds?: Id<'labels'>[];
    },
  ) => {
    const { clerkUserId } = context;

    await checkOwnership(context, arguments_.taskId, clerkUserId, 'Task not found');

    if (arguments_.projectId) {
      await checkOwnership(context, arguments_.projectId, clerkUserId, 'Project not found');
    }

    if (arguments_.labelIds) {
      await validateLabels(context, arguments_.labelIds, clerkUserId);
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (arguments_.title !== undefined)
      patch.title = validateString(arguments_.title, 'Title', 200);
    if (arguments_.description !== undefined) patch.description = arguments_.description;
    if (arguments_.status !== undefined) patch.status = arguments_.status;
    if (arguments_.priority !== undefined) patch.priority = arguments_.priority;
    if (arguments_.dueDate !== undefined) patch.dueDate = arguments_.dueDate;
    if (arguments_.projectId !== undefined) patch.projectId = arguments_.projectId;

    await context.db.patch(arguments_.taskId, patch);

    if (arguments_.labelIds) {
      await syncLabels(context, arguments_.taskId, arguments_.labelIds);
    }
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
  handler: async (
    context: UserMutationContext,
    arguments_: { taskId: Id<'tasks'>; status: 'todo' | 'doing' | 'done' },
  ) => {
    const { clerkUserId } = context;

    await checkOwnership(context, arguments_.taskId, clerkUserId, 'Task not found');

    await context.db.patch(arguments_.taskId, {
      status: arguments_.status,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update task order
 */
export const updateOrder = mutationWithUser({
  args: {
    taskId: v.id('tasks'),
    newOrder: v.number(),
  },
  handler: async (
    context: UserMutationContext,
    arguments_: { taskId: Id<'tasks'>; newOrder: number },
  ) => {
    const { clerkUserId } = context;

    await checkOwnership(context, arguments_.taskId, clerkUserId, 'Task not found');

    await context.db.patch(arguments_.taskId, {
      order: arguments_.newOrder,
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
  handler: async (
    context: UserMutationContext,
    arguments_: { taskId: Id<'tasks'>; order: number; status?: 'todo' | 'doing' | 'done' },
  ) => {
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
  handler: async (context: UserMutationContext, arguments_: { taskId: Id<'tasks'> }) => {
    const { clerkUserId } = context;

    await archiveWithCheck(context, arguments_.taskId, clerkUserId, 'Task not found');
  },
});

/**
 * Archive a task
 */
export const remove = mutationWithUser({
  args: {
    taskId: v.id('tasks'),
  },
  handler: async (context: UserMutationContext, arguments_: { taskId: Id<'tasks'> }) => {
    const { clerkUserId } = context;

    await archiveWithCheck(context, arguments_.taskId, clerkUserId, 'Task not found');
  },
});
