import { convexTest } from 'convex-test';
import { expect, describe, it, beforeEach } from 'vitest';

import { api } from '@/convex/_generated/api';
import schema from '@/convex/schema';

import { convexModules } from '../utils/convexModules';

describe('users', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    // Point to the convex functions directory
    t = convexTest(schema, convexModules);
  });

  describe('upsertMe', () => {
    it('should create a new user when user does not exist', async () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const name = 'Test User';
      const avatarUrl = 'https://example.com/avatar.jpg';

      const user = t.withIdentity({ subject: userId });

      const userDocId = await user.mutation(api.users.upsertMe, {
        email,
        name,
        avatarUrl,
      });

      expect(userDocId).toBeDefined();

      const savedUser = await t.run(ctx => ctx.db.get(userDocId));
      expect(savedUser).toBeDefined();
      expect(savedUser!.clerkUserId).toBe(userId);
      expect(savedUser!.email).toBe(email);
      expect(savedUser!.name).toBe(name);
      expect(savedUser!.avatarUrl).toBe(avatarUrl);
    });

    it('should update existing user when user exists', async () => {
      const userId = 'user123';
      const initialEmail = 'old@example.com';
      const updatedEmail = 'new@example.com';

      const user = t.withIdentity({ subject: userId });

      const userDocId1 = await user.mutation(api.users.upsertMe, {
        email: initialEmail,
        name: 'Old Name',
      });

      const userDocId2 = await user.mutation(api.users.upsertMe, {
        email: updatedEmail,
        name: 'New Name',
      });

      expect(userDocId1).toBe(userDocId2);

      const savedUser = await t.run(ctx => ctx.db.get(userDocId2));
      expect(savedUser!.email).toBe(updatedEmail);
      expect(savedUser!.name).toBe('New Name');
    });

    it('should create user with only required fields', async () => {
      const userId = 'user123';

      const user = t.withIdentity({ subject: userId });

      const userDocId = await user.mutation(api.users.upsertMe, {});

      const savedUser = await t.run(ctx => ctx.db.get(userDocId));
      expect(savedUser).toBeDefined();
      expect(savedUser!.clerkUserId).toBe(userId);
      expect(savedUser!.email).toBeUndefined();
      expect(savedUser!.name).toBeUndefined();
      expect(savedUser!.avatarUrl).toBeUndefined();
    });

    it('should set createdAt and updatedAt timestamps on create', async () => {
      const userId = 'user123';

      const user = t.withIdentity({ subject: userId });

      const beforeCreate = Date.now();
      const userDocId = await user.mutation(api.users.upsertMe, {
        email: 'test@example.com',
      });
      const afterCreate = Date.now();

      const savedUser = await t.run(ctx => ctx.db.get(userDocId));
      expect(savedUser!.createdAt).toBeGreaterThanOrEqual(beforeCreate);
      expect(savedUser!.createdAt).toBeLessThanOrEqual(afterCreate);
      expect(savedUser!.updatedAt).toEqual(savedUser!.createdAt);
    });

    it('should update updatedAt timestamp on update', async () => {
      const userId = 'user123';

      const user = t.withIdentity({ subject: userId });

      const userDocId = await user.mutation(api.users.upsertMe, {
        email: 'test@example.com',
      });

      const savedUser = await t.run(ctx => ctx.db.get(userDocId));
      const originalUpdatedAt = savedUser!.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      await user.mutation(api.users.upsertMe, {
        email: 'updated@example.com',
      });

      const updatedUser = await t.run(ctx => ctx.db.get(userDocId));
      expect(updatedUser!.updatedAt).toBeGreaterThan(originalUpdatedAt);
      expect(updatedUser!.createdAt).toBe(savedUser!.createdAt);
    });

    it('should handle multiple users with different clerk IDs', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';

      const user1Client = t.withIdentity({ subject: userId1 });
      const user2Client = t.withIdentity({ subject: userId2 });

      const userDocId1 = await user1Client.mutation(api.users.upsertMe, {
        email: 'user1@example.com',
        name: 'User 1',
      });

      const userDocId2 = await user2Client.mutation(api.users.upsertMe, {
        email: 'user2@example.com',
        name: 'User 2',
      });

      expect(userDocId1).not.toBe(userDocId2);

      const user1 = await t.run(ctx => ctx.db.get(userDocId1));
      const user2 = await t.run(ctx => ctx.db.get(userDocId2));

      expect(user1!.clerkUserId).toBe(userId1);
      expect(user2!.clerkUserId).toBe(userId2);
    });

    it('should throw error if user is not authenticated', async () => {
      await expect(
        t.mutation(api.users.upsertMe, {
          email: 'test@example.com',
        }),
      ).rejects.toThrow('Unauthenticated');
    });

    it('should allow updating only some fields', async () => {
      const userId = 'user123';

      const user = t.withIdentity({ subject: userId });

      const userDocId = await user.mutation(api.users.upsertMe, {
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      await user.mutation(api.users.upsertMe, {
        name: 'Updated Name',
      });

      const savedUser = await t.run(ctx => ctx.db.get(userDocId));
      expect(savedUser!.name).toBe('Updated Name');
      expect(savedUser!.email).toBeUndefined();
      expect(savedUser!.avatarUrl).toBeUndefined();
    });
  });

  describe('getMe', () => {
    it('should return user when user exists', async () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const name = 'Test User';

      const userClient = t.withIdentity({ subject: userId });

      await userClient.mutation(api.users.upsertMe, {
        email,
        name,
      });

      const user = await userClient.query(api.users.getMe, {});

      expect(user).toBeDefined();
      expect(user!.clerkUserId).toBe(userId);
      expect(user!.email).toBe(email);
      expect(user!.name).toBe(name);
    });

    it('should return null when user does not exist', async () => {
      const userId = 'user123';

      const userClient = t.withIdentity({ subject: userId });

      const user = await userClient.query(api.users.getMe, {});
      expect(user).toBeNull();
    });

    it('should throw error if user is not authenticated', async () => {
      await expect(t.query(api.users.getMe, {})).rejects.toThrow('Unauthenticated');
    });

    it('should only return current user data', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';

      const user1Client = t.withIdentity({ subject: userId1 });
      const user2Client = t.withIdentity({ subject: userId2 });

      await user1Client.mutation(api.users.upsertMe, {
        email: 'user1@example.com',
        name: 'User 1',
      });

      await user2Client.mutation(api.users.upsertMe, {
        email: 'user2@example.com',
        name: 'User 2',
      });

      const user = await user2Client.query(api.users.getMe, {});

      expect(user).toBeDefined();
      expect(user!.clerkUserId).toBe(userId2);
      expect(user!.email).toBe('user2@example.com');
      expect(user!.name).toBe('User 2');
    });
  });
});
