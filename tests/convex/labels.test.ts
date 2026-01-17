import { convexTest } from 'convex-test';
import { expect, describe, it, beforeEach } from 'vitest';

import { convexModules } from '../utils/convexModules';

import { api } from '@/convex/_generated/api';
import schema from '@/convex/schema';

describe('labels', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    t = convexTest(schema, convexModules);
  });

  describe('create', () => {
    it('should create a label', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const labelId = await user.mutation(api.labels.create, {
        name: 'Bug',
        color: '#ff0000',
      });

      const label = await t.run(ctx => ctx.db.get(labelId));
      expect(label).toBeDefined();
      expect(label!.name).toBe('Bug');
      expect(label!.ownerClerkUserId).toBe(userId);
    });
  });

  describe('list', () => {
    it('should list labels for user', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      await user.mutation(api.labels.create, { name: 'Bug', color: '#f00' });
      await user.mutation(api.labels.create, { name: 'Feature', color: '#0f0' });

      const labels = await user.query(api.labels.list, {});
      expect(labels).toHaveLength(2);
    });

    it('should not list labels from other users', async () => {
      const user1 = t.withIdentity({ subject: 'u1' });
      const user2 = t.withIdentity({ subject: 'u2' });

      await user1.mutation(api.labels.create, { name: 'L1', color: '#f00' });
      await user2.mutation(api.labels.create, { name: 'L2', color: '#0f0' });

      const labels1 = await user1.query(api.labels.list, {});
      expect(labels1).toHaveLength(1);
      expect(labels1[0].name).toBe('L1');
    });
  });

  describe('deleteLabel', () => {
    it('should delete a label', async () => {
      const user = t.withIdentity({ subject: 'u1' });
      const labelId = await user.mutation(api.labels.create, { name: 'L1', color: '#f00' });

      await user.mutation(api.labels.deleteLabel, { labelId });

      const label = await t.run(ctx => ctx.db.get(labelId));
      expect(label).toBeNull();
    });

    it('should cleanup task associations', async () => {
      const user = t.withIdentity({ subject: 'u1' });
      const labelId = await user.mutation(api.labels.create, { name: 'L1', color: '#f00' });
      const _taskId = await user.mutation(api.tasks.create, {
        title: 'Task',
        labelIds: [labelId],
      });

      // Verify association exists
      const assoc = await t.run(ctx => ctx.db.query('taskLabels').first());
      expect(assoc).toBeDefined();

      await user.mutation(api.labels.deleteLabel, { labelId });

      // Verify association gone
      const assocAfter = await t.run(ctx => ctx.db.query('taskLabels').first());
      expect(assocAfter).toBeNull();
    });
  });
});
