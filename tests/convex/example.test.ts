import { describe, expect, it } from 'vitest';

import { api } from '@/convex/_generated/api';
import schema from '@/convex/schema';

const modules = import.meta.glob('../../src/convex/**/*.ts');

describe('convex-test example', () => {
  it('creates and lists an inbox task', async () => {
    const { convexTest } = await import('convex-test');
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: 'user_1' });

    await asUser.mutation(api.tasks.create, {
      title: 'Test task',
      description: 'From convex-test',
      priority: 'low',
      projectId: null,
      labelIds: [],
    });

    const tasks = await asUser.query(api.tasks.listInbox, {});
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Test task');
  });

  it('filters search results per user identity', async () => {
    const { convexTest } = await import('convex-test');
    const t = convexTest(schema, modules);
    const asUserA = t.withIdentity({ subject: 'user_a' });
    const asUserB = t.withIdentity({ subject: 'user_b' });

    await asUserA.mutation(api.tasks.create, {
      title: 'Roadmap planning',
      description: 'User A task',
      priority: 'med',
      projectId: null,
      labelIds: [],
    });

    await asUserB.mutation(api.tasks.create, {
      title: 'Roadmap draft',
      description: 'User B task',
      priority: 'low',
      projectId: null,
      labelIds: [],
    });

    const userAResults = await asUserA.query(api.tasks.search, { query: 'roadmap' });
    expect(userAResults).toHaveLength(1);
    expect(userAResults[0].description).toBe('User A task');

    const userBResults = await asUserB.query(api.tasks.search, { query: 'roadmap' });
    expect(userBResults).toHaveLength(1);
    expect(userBResults[0].description).toBe('User B task');
  });
});
