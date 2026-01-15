import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { assertOwned, requireUserId } from './lib/auth';

const priorityValidator = v.union(v.literal('low'), v.literal('med'), v.literal('high'));

export const listInbox = query({
  args: {},
  handler: async ctx => {
    const ownerId = await requireUserId(ctx);
    return ctx.db
      .query('tasks')
      .withIndex('by_owner_project_order', q => q.eq('ownerId', ownerId).eq('projectId', null))
      .order('asc')
      .filter(q => q.eq(q.field('isCompleted'), false))
      .collect();
  },
});

export const listByProject = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    return ctx.db
      .query('tasks')
      .withIndex('by_owner_project_order', q =>
        q.eq('ownerId', ownerId).eq('projectId', args.projectId),
      )
      .order('asc')
      .filter(q => q.eq(q.field('isCompleted'), false))
      .collect();
  },
});

export const listToday = query({
  args: {},
  handler: async ctx => {
    const ownerId = await requireUserId(ctx);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_owner_dueDate', q => q.eq('ownerId', ownerId).lte('dueDate', end.getTime()))
      .collect();

    return tasks.filter(task => !task.isCompleted && task.dueDate !== null);
  },
});

export const listCompleted = query({
  args: {},
  handler: async ctx => {
    const ownerId = await requireUserId(ctx);
    return ctx.db
      .query('tasks')
      .withIndex('by_owner_updatedAt', q => q.eq('ownerId', ownerId))
      .order('desc')
      .filter(q => q.eq(q.field('isCompleted'), true))
      .collect();
  },
});

export const search = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const all = await ctx.db
      .query('tasks')
      .withIndex('by_owner_updatedAt', q => q.eq('ownerId', ownerId))
      .collect();
    const needle = args.query.trim().toLowerCase();
    if (!needle) return [];
    return all.filter(task => {
      const haystack = `${task.title} ${task.description}`.toLowerCase();
      return haystack.includes(needle);
    });
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.union(v.null(), v.number())),
    priority: priorityValidator,
    projectId: v.optional(v.union(v.null(), v.id('projects'))),
    labelIds: v.optional(v.array(v.id('labels'))),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const now = Date.now();
    const order = now;
    const id = await ctx.db.insert('tasks', {
      ownerId,
      title: args.title,
      description: args.description ?? '',
      isCompleted: false,
      priority: args.priority,
      dueDate: args.dueDate ?? null,
      projectId: args.projectId ?? null,
      labelIds: args.labelIds ?? [],
      order,
      createdAt: now,
      updatedAt: now,
    });
    return ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    id: v.id('tasks'),
    patch: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      priority: v.optional(priorityValidator),
      dueDate: v.optional(v.union(v.null(), v.number())),
      projectId: v.optional(v.union(v.null(), v.id('projects'))),
      labelIds: v.optional(v.array(v.id('labels'))),
      isCompleted: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const task = await ctx.db.get(args.id);
    assertOwned(task, ownerId);
    await ctx.db.patch(args.id, {
      ...args.patch,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const toggleComplete = mutation({
  args: {
    id: v.id('tasks'),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const task = await ctx.db.get(args.id);
    assertOwned(task, ownerId);
    await ctx.db.patch(args.id, {
      isCompleted: !task.isCompleted,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const reorderInProject = mutation({
  args: {
    projectId: v.union(v.null(), v.id('projects')),
    orderedIds: v.array(v.id('tasks')),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const updates = args.orderedIds.map(async (id, index) => {
      const task = await ctx.db.get(id);
      assertOwned(task, ownerId);
      if (task.projectId !== args.projectId) {
        throw new Error('Task project mismatch');
      }
      await ctx.db.patch(id, { order: index, updatedAt: Date.now() });
    });
    await Promise.all(updates);
    return true;
  },
});

export const remove = mutation({
  args: {
    id: v.id('tasks'),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const task = await ctx.db.get(args.id);
    assertOwned(task, ownerId);
    await ctx.db.delete(args.id);
    return true;
  },
});

export const listForProjectIds = query({
  args: {
    projectIds: v.array(v.id('projects')),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_owner_updatedAt', q => q.eq('ownerId', ownerId))
      .collect();
    const set = new Set<Id<'projects'>>(args.projectIds);
    return tasks.filter(task => task.projectId && set.has(task.projectId));
  },
});
