import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { assertOwned, requireUserId } from './lib/auth';

export const list = query({
  args: {},
  handler: async ctx => {
    const ownerId = await requireUserId(ctx);
    return ctx.db
      .query('projects')
      .withIndex('by_owner_order', q => q.eq('ownerId', ownerId))
      .order('asc')
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const now = Date.now();
    const last = await ctx.db
      .query('projects')
      .withIndex('by_owner_order', q => q.eq('ownerId', ownerId))
      .order('desc')
      .first();
    const order = last ? last.order + 1 : 0;
    const id = await ctx.db.insert('projects', {
      ownerId,
      name: args.name,
      color: args.color,
      icon: args.icon,
      order,
      createdAt: now,
      updatedAt: now,
    });
    return ctx.db.get(id);
  },
});

export const rename = mutation({
  args: {
    id: v.id('projects'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const project = await ctx.db.get(args.id);
    assertOwned(project, ownerId);
    await ctx.db.patch(args.id, { name: args.name, updatedAt: Date.now() });
    return args.id;
  },
});

export const reorder = mutation({
  args: {
    orderedIds: v.array(v.id('projects')),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const updates = args.orderedIds.map(async (id, index) => {
      const project = await ctx.db.get(id);
      assertOwned(project, ownerId);
      await ctx.db.patch(id, { order: index, updatedAt: Date.now() });
    });
    await Promise.all(updates);
    return true;
  },
});

export const remove = mutation({
  args: {
    id: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const project = await ctx.db.get(args.id);
    assertOwned(project, ownerId);

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_owner_project_order', q => q.eq('ownerId', ownerId).eq('projectId', args.id))
      .collect();

    const updates = tasks.map(task =>
      ctx.db.patch(task._id, {
        projectId: null,
        updatedAt: Date.now(),
      }),
    );
    await Promise.all(updates);

    await ctx.db.delete(args.id);
    return true;
  },
});
