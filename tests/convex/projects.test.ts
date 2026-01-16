import { convexTest } from 'convex-test';
import { expect, describe, it, beforeEach } from 'vitest';

import { api } from '@/convex/_generated/api';
import { type Id } from '@/convex/_generated/dataModel';
import schema from '@/convex/schema';

describe('projects', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    // Point to the convex functions directory
    t = convexTest(schema, '../../src/convex');
  });

  describe('create', () => {
    it('should create a project with required fields', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const projectId = await t.mutation(api.projects.create, {
          name: 'Test Project',
        });

        expect(projectId).toBeDefined();

        const project = await ctx.db.get(projectId);
        expect(project).toBeDefined();
        expect(project!.name).toBe('Test Project');
        expect(project!.ownerClerkUserId).toBe(userId);
        expect(project!.archived).toBe(false);
      });
    });

    it('should trim whitespace from name', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const projectId = await t.mutation(api.projects.create, {
          name: '  Trimmed Project  ',
        });

        const project = await ctx.db.get(projectId);
        expect(project!.name).toBe('Trimmed Project');
      });
    });

    it('should throw error if name is empty after trim', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        await expect(
          t.mutation(api.projects.create, {
            name: '   ',
          })
        ).rejects.toThrow('Project name is required');
      });
    });

    it('should throw error if name exceeds 100 characters', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const longName = 'a'.repeat(101);
        await expect(
          t.mutation(api.projects.create, {
            name: longName,
          })
        ).rejects.toThrow('Project name must be 100 characters or less');
      });
    });

    it('should throw error if user is not authenticated', async () => {
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => null } as any;

        await expect(
          t.mutation(api.projects.create, {
            name: 'Project',
          })
        ).rejects.toThrow('Unauthenticated');
      });
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const beforeCreate = Date.now();
        const projectId = await t.mutation(api.projects.create, {
          name: 'Project',
        });
        const afterCreate = Date.now();

        const project = await ctx.db.get(projectId);
        expect(project!.createdAt).toBeGreaterThanOrEqual(beforeCreate);
        expect(project!.createdAt).toBeLessThanOrEqual(afterCreate);
        expect(project!.updatedAt).toEqual(project!.createdAt);
      });
    });
  });

  describe('list', () => {
    it('should return empty array when no projects exist', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const projects = await t.query(api.projects.list, {});
        expect(projects).toEqual([]);
      });
    });

    it('should list all user projects', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        await t.mutation(api.projects.create, { name: 'Project 1' });
        await t.mutation(api.projects.create, { name: 'Project 2' });
        await t.mutation(api.projects.create, { name: 'Project 3' });

        const projects = await t.query(api.projects.list, {});
        expect(projects).toHaveLength(3);
      });
    });

    it('should exclude archived projects by default', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const projectId1 = await t.mutation(api.projects.create, { name: 'Project 1' });
        await t.mutation(api.projects.create, { name: 'Project 2' });

        // Archive one project
        await t.mutation(api.projects.archive, { projectId: projectId1 });

        const projects = await t.query(api.projects.list, {});
        expect(projects).toHaveLength(1);
        expect(projects[0].name).toBe('Project 2');
      });
    });

    it('should include archived projects when specified', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const projectId1 = await t.mutation(api.projects.create, { name: 'Project 1' });
        await t.mutation(api.projects.create, { name: 'Project 2' });

        await t.mutation(api.projects.archive, { projectId: projectId1 });

        const projects = await t.query(api.projects.list, { includeArchived: true });
        expect(projects).toHaveLength(2);
      });
    });

    it('should sort projects in descending order', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        await t.mutation(api.projects.create, { name: 'Project 1' });
        await new Promise(resolve => setTimeout(resolve, 10));
        await t.mutation(api.projects.create, { name: 'Project 2' });
        await new Promise(resolve => setTimeout(resolve, 10));
        await t.mutation(api.projects.create, { name: 'Project 3' });

        const projects = await t.query(api.projects.list, {});
        
        // Most recent first
        expect(projects[0].name).toBe('Project 3');
        expect(projects[1].name).toBe('Project 2');
        expect(projects[2].name).toBe('Project 1');
      });
    });

    it('should not return projects from other users', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      await t.run(async (ctx) => {
        // Create projects for user1
        ctx.auth = { getUserIdentity: async () => ({ subject: userId1 }) } as any;
        await t.mutation(api.projects.create, { name: 'User1 Project' });

        // Switch to user2 and create their projects
        ctx.auth = { getUserIdentity: async () => ({ subject: userId2 }) } as any;
        await t.mutation(api.projects.create, { name: 'User2 Project' });

        // Query as user2
        const projects = await t.query(api.projects.list, {});
        expect(projects).toHaveLength(1);
        expect(projects[0].name).toBe('User2 Project');
      });
    });

    it('should throw error if user is not authenticated', async () => {
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => null } as any;

        await expect(t.query(api.projects.list, {})).rejects.toThrow('Unauthenticated');
      });
    });
  });

  describe('update', () => {
    it('should update project name', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const projectId = await t.mutation(api.projects.create, { name: 'Old Name' });

        await t.mutation(api.projects.update, {
          projectId,
          name: 'New Name',
        });

        const project = await ctx.db.get(projectId);
        expect(project!.name).toBe('New Name');
      });
    });

    it('should trim whitespace from name', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const projectId = await t.mutation(api.projects.create, { name: 'Project' });

        await t.mutation(api.projects.update, {
          projectId,
          name: '  Updated Project  ',
        });

        const project = await ctx.db.get(projectId);
        expect(project!.name).toBe('Updated Project');
      });
    });

    it('should throw error if project does not exist', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const fakeProjectId = 'jh71z6b8j3n7t8v9w0x1y2z3a4b5c6d7' as Id<'projects'>;
        await expect(
          t.mutation(api.projects.update, {
            projectId: fakeProjectId,
            name: 'New Name',
          })
        ).rejects.toThrow('Project not found');
      });
    });

    it('should throw error if user does not own the project', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      await t.run(async (ctx) => {
        // Create project as user1
        ctx.auth = { getUserIdentity: async () => ({ subject: userId1 }) } as any;
        const projectId = await t.mutation(api.projects.create, { name: 'Project' });

        // Try to update as user2
        ctx.auth = { getUserIdentity: async () => ({ subject: userId2 }) } as any;
        await expect(
          t.mutation(api.projects.update, {
            projectId,
            name: 'New Name',
          })
        ).rejects.toThrow('Unauthorized');
      });
    });

    it('should throw error if name is empty after trim', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const projectId = await t.mutation(api.projects.create, { name: 'Project' });

        await expect(
          t.mutation(api.projects.update, {
            projectId,
            name: '   ',
          })
        ).rejects.toThrow('Project name is required');
      });
    });

    it('should throw error if name exceeds 100 characters', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const projectId = await t.mutation(api.projects.create, { name: 'Project' });
        const longName = 'a'.repeat(101);

        await expect(
          t.mutation(api.projects.update, {
            projectId,
            name: longName,
          })
        ).rejects.toThrow('Project name must be 100 characters or less');
      });
    });

    it('should update updatedAt timestamp', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const projectId = await t.mutation(api.projects.create, { name: 'Project' });
        const project = await ctx.db.get(projectId);
        const originalUpdatedAt = project!.updatedAt;

        // Wait a tiny bit to ensure timestamp changes
        await new Promise(resolve => setTimeout(resolve, 10));

        await t.mutation(api.projects.update, {
          projectId,
          name: 'Updated Project',
        });

        const updatedProject = await ctx.db.get(projectId);
        expect(updatedProject!.updatedAt).toBeGreaterThan(originalUpdatedAt);
      });
    });
  });

  describe('archive', () => {
    it('should archive a project', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const projectId = await t.mutation(api.projects.create, { name: 'Project' });

        await t.mutation(api.projects.archive, { projectId });

        const project = await ctx.db.get(projectId);
        expect(project!.archived).toBe(true);
      });
    });

    it('should throw error if project does not exist', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const fakeProjectId = 'jh71z6b8j3n7t8v9w0x1y2z3a4b5c6d7' as Id<'projects'>;
        await expect(
          t.mutation(api.projects.archive, { projectId: fakeProjectId })
        ).rejects.toThrow('Project not found');
      });
    });

    it('should throw error if user does not own the project', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      await t.run(async (ctx) => {
        // Create project as user1
        ctx.auth = { getUserIdentity: async () => ({ subject: userId1 }) } as any;
        const projectId = await t.mutation(api.projects.create, { name: 'Project' });

        // Try to archive as user2
        ctx.auth = { getUserIdentity: async () => ({ subject: userId2 }) } as any;
        await expect(
          t.mutation(api.projects.archive, { projectId })
        ).rejects.toThrow('Unauthorized');
      });
    });

    it('should update updatedAt timestamp when archiving', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const projectId = await t.mutation(api.projects.create, { name: 'Project' });
        const project = await ctx.db.get(projectId);
        const originalUpdatedAt = project!.updatedAt;

        await new Promise(resolve => setTimeout(resolve, 10));

        await t.mutation(api.projects.archive, { projectId });

        const archivedProject = await ctx.db.get(projectId);
        expect(archivedProject!.updatedAt).toBeGreaterThan(originalUpdatedAt);
      });
    });
  });
});
