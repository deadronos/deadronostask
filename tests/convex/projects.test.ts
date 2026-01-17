import { convexTest } from 'convex-test';
import { expect, describe, it, beforeEach } from 'vitest';

import { convexModules } from '../utils/convexModules';

import { api } from '@/convex/_generated/api';
import schema from '@/convex/schema';

describe('projects', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    // Point to the convex functions directory
    t = convexTest(schema, convexModules);
  });

  describe('create', () => {
    it('should create a project with required fields', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId = await user.mutation(api.projects.create, {
        name: 'Test Project',
      });

      expect(projectId).toBeDefined();

      const project = await t.run(ctx => ctx.db.get(projectId));
      expect(project).toBeDefined();
      expect(project!.name).toBe('Test Project');
      expect(project!.ownerClerkUserId).toBe(userId);
      expect(project!.archived).toBe(false);
    });

    it('should trim whitespace from name', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId = await user.mutation(api.projects.create, {
        name: '  Trimmed Project  ',
      });

      const project = await t.run(ctx => ctx.db.get(projectId));
      expect(project!.name).toBe('Trimmed Project');
    });

    it('should throw error if name is empty after trim', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      await expect(
        user.mutation(api.projects.create, {
          name: '   ',
        }),
      ).rejects.toThrow('Project name is required');
    });

    it('should throw error if name exceeds 100 characters', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const longName = 'a'.repeat(101);
      await expect(
        user.mutation(api.projects.create, {
          name: longName,
        }),
      ).rejects.toThrow('Project name must be 100 characters or less');
    });

    it('should throw error if user is not authenticated', async () => {
      await expect(
        t.mutation(api.projects.create, {
          name: 'Project',
        }),
      ).rejects.toThrow('Unauthenticated');
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const beforeCreate = Date.now();
      const projectId = await user.mutation(api.projects.create, {
        name: 'Project',
      });
      const afterCreate = Date.now();

      const project = await t.run(ctx => ctx.db.get(projectId));
      expect(project!.createdAt).toBeGreaterThanOrEqual(beforeCreate);
      expect(project!.createdAt).toBeLessThanOrEqual(afterCreate);
      expect(project!.updatedAt).toEqual(project!.createdAt);
    });
  });

  describe('list', () => {
    it('should return empty array when no projects exist', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projects = await user.query(api.projects.list, {});
      expect(projects).toEqual([]);
    });

    it('should list all user projects', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      await user.mutation(api.projects.create, { name: 'Project 1' });
      await user.mutation(api.projects.create, { name: 'Project 2' });
      await user.mutation(api.projects.create, { name: 'Project 3' });

      const projects = await user.query(api.projects.list, {});
      expect(projects).toHaveLength(3);
    });

    it('should exclude archived projects by default', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId1 = await user.mutation(api.projects.create, { name: 'Project 1' });
      await user.mutation(api.projects.create, { name: 'Project 2' });

      await user.mutation(api.projects.archive, { projectId: projectId1 });

      const projects = await user.query(api.projects.list, {});
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Project 2');
    });

    it('should include archived projects when specified', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId1 = await user.mutation(api.projects.create, { name: 'Project 1' });
      await user.mutation(api.projects.create, { name: 'Project 2' });

      await user.mutation(api.projects.archive, { projectId: projectId1 });

      const projects = await user.query(api.projects.list, { includeArchived: true });
      expect(projects).toHaveLength(2);
    });

    it('should sort projects in descending order', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      await user.mutation(api.projects.create, { name: 'Project 1' });
      await new Promise(resolve => setTimeout(resolve, 10));
      await user.mutation(api.projects.create, { name: 'Project 2' });
      await new Promise(resolve => setTimeout(resolve, 10));
      await user.mutation(api.projects.create, { name: 'Project 3' });

      const projects = await user.query(api.projects.list, {});

      expect(projects[0].name).toBe('Project 3');
      expect(projects[1].name).toBe('Project 2');
      expect(projects[2].name).toBe('Project 1');
    });

    it('should not return projects from other users', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      const user1 = t.withIdentity({ subject: userId1 });
      const user2 = t.withIdentity({ subject: userId2 });

      await user1.mutation(api.projects.create, { name: 'User1 Project' });
      await user2.mutation(api.projects.create, { name: 'User2 Project' });

      const projects = await user2.query(api.projects.list, {});
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('User2 Project');
    });

    it('should throw error if user is not authenticated', async () => {
      await expect(t.query(api.projects.list, {})).rejects.toThrow('Unauthenticated');
    });
  });

  describe('update', () => {
    it('should update project name', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId = await user.mutation(api.projects.create, { name: 'Old Name' });

      await user.mutation(api.projects.update, {
        projectId,
        name: 'New Name',
      });

      const project = await t.run(ctx => ctx.db.get(projectId));
      expect(project!.name).toBe('New Name');
    });

    it('should trim whitespace from name', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId = await user.mutation(api.projects.create, { name: 'Project' });

      await user.mutation(api.projects.update, {
        projectId,
        name: '  Updated Project  ',
      });

      const project = await t.run(ctx => ctx.db.get(projectId));
      expect(project!.name).toBe('Updated Project');
    });

    it('should throw error if project does not exist', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const missingProjectId = await user.mutation(api.projects.create, { name: 'Missing Project' });
      await t.run(ctx => ctx.db.delete(missingProjectId));

      await expect(
        user.mutation(api.projects.update, {
          projectId: missingProjectId,
          name: 'New Name',
        }),
      ).rejects.toThrow('Project not found');
    });

    it('should throw error if user does not own the project', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      const user1 = t.withIdentity({ subject: userId1 });
      const user2 = t.withIdentity({ subject: userId2 });

      const projectId = await user1.mutation(api.projects.create, { name: 'Project' });

      await expect(
        user2.mutation(api.projects.update, {
          projectId,
          name: 'New Name',
        }),
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw error if name is empty after trim', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId = await user.mutation(api.projects.create, { name: 'Project' });

      await expect(
        user.mutation(api.projects.update, {
          projectId,
          name: '   ',
        }),
      ).rejects.toThrow('Project name is required');
    });

    it('should throw error if name exceeds 100 characters', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId = await user.mutation(api.projects.create, { name: 'Project' });
      const longName = 'a'.repeat(101);

      await expect(
        user.mutation(api.projects.update, {
          projectId,
          name: longName,
        }),
      ).rejects.toThrow('Project name must be 100 characters or less');
    });

    it('should update updatedAt timestamp', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId = await user.mutation(api.projects.create, { name: 'Project' });
      const project = await t.run(ctx => ctx.db.get(projectId));
      const originalUpdatedAt = project!.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      await user.mutation(api.projects.update, {
        projectId,
        name: 'Updated Project',
      });

      const updatedProject = await t.run(ctx => ctx.db.get(projectId));
      expect(updatedProject!.updatedAt).toBeGreaterThan(originalUpdatedAt);
    });
  });

  describe('archive', () => {
    it('should archive a project', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId = await user.mutation(api.projects.create, { name: 'Project' });

      await user.mutation(api.projects.archive, { projectId });

      const project = await t.run(ctx => ctx.db.get(projectId));
      expect(project!.archived).toBe(true);
    });

    it('should throw error if project does not exist', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const missingProjectId = await user.mutation(api.projects.create, { name: 'Missing Project' });
      await t.run(ctx => ctx.db.delete(missingProjectId));

      await expect(
        user.mutation(api.projects.archive, { projectId: missingProjectId }),
      ).rejects.toThrow('Project not found');
    });

    it('should throw error if user does not own the project', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      const user1 = t.withIdentity({ subject: userId1 });
      const user2 = t.withIdentity({ subject: userId2 });

      const projectId = await user1.mutation(api.projects.create, { name: 'Project' });

      await expect(user2.mutation(api.projects.archive, { projectId })).rejects.toThrow(
        'Unauthorized',
      );
    });

    it('should update updatedAt timestamp when archiving', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId = await user.mutation(api.projects.create, { name: 'Project' });
      const project = await t.run(ctx => ctx.db.get(projectId));
      const originalUpdatedAt = project!.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      await user.mutation(api.projects.archive, { projectId });

      const archivedProject = await t.run(ctx => ctx.db.get(projectId));
      expect(archivedProject!.updatedAt).toBeGreaterThan(originalUpdatedAt);
    });
  });
});
