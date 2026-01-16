import { convexTest } from 'convex-test';
import { expect, describe, it, beforeEach } from 'vitest';

import { api } from '@/convex/_generated/api';
import schema from '@/convex/schema';

describe('users', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    // Point to the convex functions directory
    t = convexTest(schema, '../../src/convex');
  });

  describe('upsertMe', () => {
    it('should create a new user when user does not exist', async () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const name = 'Test User';
      const avatarUrl = 'https://example.com/avatar.jpg';

      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const userDocId = await t.mutation(api.users.upsertMe, {
          email,
          name,
          avatarUrl,
        });

        expect(userDocId).toBeDefined();

        const user = await ctx.db.get(userDocId);
        expect(user).toBeDefined();
        expect(user!.clerkUserId).toBe(userId);
        expect(user!.email).toBe(email);
        expect(user!.name).toBe(name);
        expect(user!.avatarUrl).toBe(avatarUrl);
      });
    });

    it('should update existing user when user exists', async () => {
      const userId = 'user123';
      const initialEmail = 'old@example.com';
      const updatedEmail = 'new@example.com';

      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        // Create user
        const userDocId1 = await t.mutation(api.users.upsertMe, {
          email: initialEmail,
          name: 'Old Name',
        });

        // Update user
        const userDocId2 = await t.mutation(api.users.upsertMe, {
          email: updatedEmail,
          name: 'New Name',
        });

        // Should return the same user ID
        expect(userDocId1).toBe(userDocId2);

        const user = await ctx.db.get(userDocId2);
        expect(user!.email).toBe(updatedEmail);
        expect(user!.name).toBe('New Name');
      });
    });

    it('should create user with only required fields', async () => {
      const userId = 'user123';

      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const userDocId = await t.mutation(api.users.upsertMe, {});

        const user = await ctx.db.get(userDocId);
        expect(user).toBeDefined();
        expect(user!.clerkUserId).toBe(userId);
        expect(user!.email).toBeUndefined();
        expect(user!.name).toBeUndefined();
        expect(user!.avatarUrl).toBeUndefined();
      });
    });

    it('should set createdAt and updatedAt timestamps on create', async () => {
      const userId = 'user123';

      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const beforeCreate = Date.now();
        const userDocId = await t.mutation(api.users.upsertMe, {
          email: 'test@example.com',
        });
        const afterCreate = Date.now();

        const user = await ctx.db.get(userDocId);
        expect(user!.createdAt).toBeGreaterThanOrEqual(beforeCreate);
        expect(user!.createdAt).toBeLessThanOrEqual(afterCreate);
        expect(user!.updatedAt).toEqual(user!.createdAt);
      });
    });

    it('should update updatedAt timestamp on update', async () => {
      const userId = 'user123';

      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const userDocId = await t.mutation(api.users.upsertMe, {
          email: 'test@example.com',
        });

        const user = await ctx.db.get(userDocId);
        const originalUpdatedAt = user!.updatedAt;

        // Wait a tiny bit to ensure timestamp changes
        await new Promise(resolve => setTimeout(resolve, 10));

        await t.mutation(api.users.upsertMe, {
          email: 'updated@example.com',
        });

        const updatedUser = await ctx.db.get(userDocId);
        expect(updatedUser!.updatedAt).toBeGreaterThan(originalUpdatedAt);
        expect(updatedUser!.createdAt).toBe(user!.createdAt); // createdAt should not change
      });
    });

    it('should handle multiple users with different clerk IDs', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';

      await t.run(async (ctx) => {
        // Create first user
        ctx.auth = { getUserIdentity: async () => ({ subject: userId1 }) } as any;
        const userDocId1 = await t.mutation(api.users.upsertMe, {
          email: 'user1@example.com',
          name: 'User 1',
        });

        // Create second user
        ctx.auth = { getUserIdentity: async () => ({ subject: userId2 }) } as any;
        const userDocId2 = await t.mutation(api.users.upsertMe, {
          email: 'user2@example.com',
          name: 'User 2',
        });

        // Should be different users
        expect(userDocId1).not.toBe(userDocId2);

        const user1 = await ctx.db.get(userDocId1);
        const user2 = await ctx.db.get(userDocId2);

        expect(user1!.clerkUserId).toBe(userId1);
        expect(user2!.clerkUserId).toBe(userId2);
      });
    });

    it('should throw error if user is not authenticated', async () => {
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => null } as any;

        await expect(
          t.mutation(api.users.upsertMe, {
            email: 'test@example.com',
          })
        ).rejects.toThrow('Unauthenticated');
      });
    });

    it('should allow updating only some fields', async () => {
      const userId = 'user123';

      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        // Create user with all fields
        const userDocId = await t.mutation(api.users.upsertMe, {
          email: 'test@example.com',
          name: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
        });

        // Update only name
        await t.mutation(api.users.upsertMe, {
          name: 'Updated Name',
        });

        const user = await ctx.db.get(userDocId);
        expect(user!.name).toBe('Updated Name');
        // Email and avatarUrl should be updated to undefined since they weren't provided
        expect(user!.email).toBeUndefined();
        expect(user!.avatarUrl).toBeUndefined();
      });
    });
  });

  describe('getMe', () => {
    it('should return user when user exists', async () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const name = 'Test User';

      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        // Create user first
        await t.mutation(api.users.upsertMe, {
          email,
          name,
        });

        // Get user
        const user = await t.query(api.users.getMe, {});

        expect(user).toBeDefined();
        expect(user!.clerkUserId).toBe(userId);
        expect(user!.email).toBe(email);
        expect(user!.name).toBe(name);
      });
    });

    it('should return null when user does not exist', async () => {
      const userId = 'user123';

      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const user = await t.query(api.users.getMe, {});
        expect(user).toBeNull();
      });
    });

    it('should throw error if user is not authenticated', async () => {
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => null } as any;

        await expect(t.query(api.users.getMe, {})).rejects.toThrow('Unauthenticated');
      });
    });

    it('should only return current user data', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';

      await t.run(async (ctx) => {
        // Create first user
        ctx.auth = { getUserIdentity: async () => ({ subject: userId1 }) } as any;
        await t.mutation(api.users.upsertMe, {
          email: 'user1@example.com',
          name: 'User 1',
        });

        // Create second user
        ctx.auth = { getUserIdentity: async () => ({ subject: userId2 }) } as any;
        await t.mutation(api.users.upsertMe, {
          email: 'user2@example.com',
          name: 'User 2',
        });

        // Query as user2
        const user = await t.query(api.users.getMe, {});

        expect(user).toBeDefined();
        expect(user!.clerkUserId).toBe(userId2);
        expect(user!.email).toBe('user2@example.com');
        expect(user!.name).toBe('User 2');
      });
    });
  });
});
