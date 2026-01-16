/// <reference types="vite/client" />

import { describe, expect, it } from 'vitest';

import schema from '@/convex/schema';
import { makeFunctionReference } from 'convex/server';

const modules = import.meta.glob('../../src/convex/**/*.ts');

const tasksCreate = makeFunctionReference<'mutation'>('tasks:create');
const tasksListInbox = makeFunctionReference<'query'>('tasks:listInbox');
const tasksSearch = makeFunctionReference<'query'>('tasks:search');

describe('convex-test example', () => {
  it('creates and lists an inbox task', async () => {
    const { convexTest } = await import('convex-test');
    const t = convexTest(schema, modules);
    const userId = await t.run(ctx => ctx.db.insert('users', { name: 'Test User' }));
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(tasksCreate, {
      title: 'Test task',
      description: 'From convex-test',
      priority: 'low',
      projectId: null,
      labelIds: [],
    });

    const tasks = await asUser.query(tasksListInbox, {});
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Test task');
  });

  it('filters search results per user identity', async () => {
    const { convexTest } = await import('convex-test');
    const t = convexTest(schema, modules);
    const userAId = await t.run(ctx => ctx.db.insert('users', { name: 'User A' }));
    const userBId = await t.run(ctx => ctx.db.insert('users', { name: 'User B' }));
    const asUserA = t.withIdentity({ subject: userAId });
    const asUserB = t.withIdentity({ subject: userBId });

    await asUserA.mutation(tasksCreate, {
      title: 'Roadmap planning',
      description: 'User A task',
      priority: 'med',
      projectId: null,
      labelIds: [],
    });

    await asUserB.mutation(tasksCreate, {
      title: 'Roadmap draft',
      description: 'User B task',
      priority: 'low',
      projectId: null,
      labelIds: [],
    });

    const userAResults = await asUserA.query(tasksSearch, { query: 'roadmap' });
    expect(userAResults).toHaveLength(1);
    expect(userAResults[0].description).toBe('User A task');

    const userBResults = await asUserB.query(tasksSearch, { query: 'roadmap' });
    expect(userBResults).toHaveLength(1);
    expect(userBResults[0].description).toBe('User B task');
  });
});
