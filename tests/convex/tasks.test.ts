import { convexTest } from 'convex-test';
import { expect, describe, it, beforeEach } from 'vitest';
import { api } from '@/convex/_generated/api';
import schema from '@/convex/schema';
import { Id } from '@/convex/_generated/dataModel';

describe('tasks', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    // Point to the convex functions directory
    t = convexTest(schema, '../../src/convex');
  });

  describe('create', () => {
    it('should create a task with required fields', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId = await t.mutation(api.tasks.create, {
          title: 'Test Task',
        });

        expect(taskId).toBeDefined();

        const task = await ctx.db.get(taskId);
        expect(task).toBeDefined();
        expect(task!.title).toBe('Test Task');
        expect(task!.ownerClerkUserId).toBe(userId);
        expect(task!.status).toBe('todo');
        expect(task!.priority).toBe(0);
        expect(task!.archived).toBe(false);
        expect(task!.order).toBe(1);
      });
    });

    it('should create a task with all optional fields', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        // Create a project first
        const projectId = await ctx.db.insert('projects', {
          ownerClerkUserId: userId,
          name: 'Test Project',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        const dueAt = Date.now() + 86400000; // Tomorrow
        const taskId = await t.mutation(api.tasks.create, {
          title: 'Complete Task',
          description: 'Task description',
          priority: 2,
          dueAt,
          projectId,
        });

        const task = await ctx.db.get(taskId);
        expect(task).toBeDefined();
        expect(task!.title).toBe('Complete Task');
        expect(task!.description).toBe('Task description');
        expect(task!.priority).toBe(2);
        expect(task!.dueAt).toBe(dueAt);
        expect(task!.projectId).toBe(projectId);
      });
    });

    it('should trim whitespace from title', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId = await t.mutation(api.tasks.create, {
          title: '  Trimmed Task  ',
        });

        const task = await ctx.db.get(taskId);
        expect(task!.title).toBe('Trimmed Task');
      });
    });

    it('should throw error if title is empty after trim', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        await expect(
          t.mutation(api.tasks.create, {
            title: '   ',
          })
        ).rejects.toThrow('Task title is required');
      });
    });

    it('should throw error if title exceeds 200 characters', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const longTitle = 'a'.repeat(201);
        await expect(
          t.mutation(api.tasks.create, {
            title: longTitle,
          })
        ).rejects.toThrow('Task title must be 200 characters or less');
      });
    });

    it('should throw error if projectId does not exist', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const fakeProjectId = 'jh71z6b8j3n7t8v9w0x1y2z3a4b5c6d7' as Id<'projects'>;
        await expect(
          t.mutation(api.tasks.create, {
            title: 'Task',
            projectId: fakeProjectId,
          })
        ).rejects.toThrow('Project not found');
      });
    });

    it('should throw error if project belongs to different user', async () => {
      const userId = 'user123';
      const otherUserId = 'user456';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        // Create project owned by another user
        const projectId = await ctx.db.insert('projects', {
          ownerClerkUserId: otherUserId,
          name: 'Other User Project',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        await expect(
          t.mutation(api.tasks.create, {
            title: 'Task',
            projectId,
          })
        ).rejects.toThrow('Unauthorized');
      });
    });

    it('should increment order for subsequent tasks', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId1 = await t.mutation(api.tasks.create, {
          title: 'Task 1',
        });
        const taskId2 = await t.mutation(api.tasks.create, {
          title: 'Task 2',
        });
        const taskId3 = await t.mutation(api.tasks.create, {
          title: 'Task 3',
        });

        const task1 = await ctx.db.get(taskId1);
        const task2 = await ctx.db.get(taskId2);
        const task3 = await ctx.db.get(taskId3);

        expect(task1!.order).toBe(1);
        expect(task2!.order).toBe(2);
        expect(task3!.order).toBe(3);
      });
    });

    it('should throw error if user is not authenticated', async () => {
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => null } as any;

        await expect(
          t.mutation(api.tasks.create, {
            title: 'Task',
          })
        ).rejects.toThrow('Unauthenticated');
      });
    });
  });

  describe('list', () => {
    it('should return empty array when no tasks exist', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const tasks = await t.query(api.tasks.list, {});
        expect(tasks).toEqual([]);
      });
    });

    it('should list all user tasks by default', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        await t.mutation(api.tasks.create, { title: 'Task 1' });
        await t.mutation(api.tasks.create, { title: 'Task 2' });
        await t.mutation(api.tasks.create, { title: 'Task 3' });

        const tasks = await t.query(api.tasks.list, {});
        expect(tasks).toHaveLength(3);
      });
    });

    it('should exclude archived tasks by default', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId1 = await t.mutation(api.tasks.create, { title: 'Task 1' });
        await t.mutation(api.tasks.create, { title: 'Task 2' });

        // Archive one task
        await t.mutation(api.tasks.archive, { taskId: taskId1 });

        const tasks = await t.query(api.tasks.list, {});
        expect(tasks).toHaveLength(1);
        expect(tasks[0].title).toBe('Task 2');
      });
    });

    it('should include archived tasks when specified', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId1 = await t.mutation(api.tasks.create, { title: 'Task 1' });
        await t.mutation(api.tasks.create, { title: 'Task 2' });

        await t.mutation(api.tasks.archive, { taskId: taskId1 });

        const tasks = await t.query(api.tasks.list, { includeArchived: true });
        expect(tasks).toHaveLength(2);
      });
    });

    it('should filter tasks by projectId', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const projectId1 = await ctx.db.insert('projects', {
          ownerClerkUserId: userId,
          name: 'Project 1',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        const projectId2 = await ctx.db.insert('projects', {
          ownerClerkUserId: userId,
          name: 'Project 2',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        await t.mutation(api.tasks.create, { title: 'Task 1', projectId: projectId1 });
        await t.mutation(api.tasks.create, { title: 'Task 2', projectId: projectId2 });
        await t.mutation(api.tasks.create, { title: 'Task 3', projectId: projectId1 });

        const tasks = await t.query(api.tasks.list, { projectId: projectId1 });
        expect(tasks).toHaveLength(2);
        expect(tasks.every(t => t.projectId === projectId1)).toBe(true);
      });
    });

    it('should filter tasks by null projectId', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const projectId = await ctx.db.insert('projects', {
          ownerClerkUserId: userId,
          name: 'Project',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        await t.mutation(api.tasks.create, { title: 'Task 1' });
        await t.mutation(api.tasks.create, { title: 'Task 2', projectId });

        const tasks = await t.query(api.tasks.list, { projectId: null });
        expect(tasks).toHaveLength(1);
        expect(tasks[0].title).toBe('Task 1');
      });
    });

    it('should filter tasks by status', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId1 = await t.mutation(api.tasks.create, { title: 'Task 1' });
        const taskId2 = await t.mutation(api.tasks.create, { title: 'Task 2' });
        await t.mutation(api.tasks.create, { title: 'Task 3' });

        await t.mutation(api.tasks.setStatus, { taskId: taskId1, status: 'doing' });
        await t.mutation(api.tasks.setStatus, { taskId: taskId2, status: 'done' });

        const todoTasks = await t.query(api.tasks.list, { status: 'todo' });
        const doingTasks = await t.query(api.tasks.list, { status: 'doing' });
        const doneTasks = await t.query(api.tasks.list, { status: 'done' });

        expect(todoTasks).toHaveLength(1);
        expect(doingTasks).toHaveLength(1);
        expect(doneTasks).toHaveLength(1);
      });
    });

    it('should filter tasks by search term in title', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        await t.mutation(api.tasks.create, { title: 'Buy groceries' });
        await t.mutation(api.tasks.create, { title: 'Call mom' });
        await t.mutation(api.tasks.create, { title: 'Buy tickets' });

        const tasks = await t.query(api.tasks.list, { search: 'buy' });
        expect(tasks).toHaveLength(2);
        expect(tasks.every(t => t.title.toLowerCase().includes('buy'))).toBe(true);
      });
    });

    it('should filter tasks by search term in description', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        await t.mutation(api.tasks.create, {
          title: 'Task 1',
          description: 'Important meeting',
        });
        await t.mutation(api.tasks.create, {
          title: 'Task 2',
          description: 'Regular task',
        });

        const tasks = await t.query(api.tasks.list, { search: 'important' });
        expect(tasks).toHaveLength(1);
        expect(tasks[0].title).toBe('Task 1');
      });
    });

    it('should sort tasks by order then creation time', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId1 = await t.mutation(api.tasks.create, { title: 'Task 1' });
        const taskId2 = await t.mutation(api.tasks.create, { title: 'Task 2' });
        const taskId3 = await t.mutation(api.tasks.create, { title: 'Task 3' });

        // Change order
        await t.mutation(api.tasks.reorder, { taskId: taskId2, order: 10 });

        const tasks = await t.query(api.tasks.list, {});
        expect(tasks[0]._id).toBe(taskId1);
        expect(tasks[1]._id).toBe(taskId3);
        expect(tasks[2]._id).toBe(taskId2);
      });
    });

    it('should not return tasks from other users', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      await t.run(async (ctx) => {
        // Create tasks for user1
        ctx.auth = { getUserIdentity: async () => ({ subject: userId1 }) } as any;
        await t.mutation(api.tasks.create, { title: 'User1 Task' });

        // Switch to user2 and create their tasks
        ctx.auth = { getUserIdentity: async () => ({ subject: userId2 }) } as any;
        await t.mutation(api.tasks.create, { title: 'User2 Task' });

        // Query as user2
        const tasks = await t.query(api.tasks.list, {});
        expect(tasks).toHaveLength(1);
        expect(tasks[0].title).toBe('User2 Task');
      });
    });
  });

  describe('update', () => {
    it('should update task title', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId = await t.mutation(api.tasks.create, { title: 'Old Title' });

        await t.mutation(api.tasks.update, {
          taskId,
          title: 'New Title',
        });

        const task = await ctx.db.get(taskId);
        expect(task!.title).toBe('New Title');
      });
    });

    it('should update task description', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId = await t.mutation(api.tasks.create, { title: 'Task' });

        await t.mutation(api.tasks.update, {
          taskId,
          description: 'New description',
        });

        const task = await ctx.db.get(taskId);
        expect(task!.description).toBe('New description');
      });
    });

    it('should update task priority', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId = await t.mutation(api.tasks.create, { title: 'Task', priority: 0 });

        await t.mutation(api.tasks.update, {
          taskId,
          priority: 3,
        });

        const task = await ctx.db.get(taskId);
        expect(task!.priority).toBe(3);
      });
    });

    it('should update task dueAt', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId = await t.mutation(api.tasks.create, { title: 'Task' });
        const newDueAt = Date.now() + 86400000;

        await t.mutation(api.tasks.update, {
          taskId,
          dueAt: newDueAt,
        });

        const task = await ctx.db.get(taskId);
        expect(task!.dueAt).toBe(newDueAt);
      });
    });

    it('should clear task dueAt when set to null', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const dueAt = Date.now() + 86400000;
        const taskId = await t.mutation(api.tasks.create, { title: 'Task', dueAt });

        await t.mutation(api.tasks.update, {
          taskId,
          dueAt: null,
        });

        const task = await ctx.db.get(taskId);
        expect(task!.dueAt).toBeUndefined();
      });
    });

    it('should update task projectId', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const projectId = await ctx.db.insert('projects', {
          ownerClerkUserId: userId,
          name: 'Project',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        const taskId = await t.mutation(api.tasks.create, { title: 'Task' });

        await t.mutation(api.tasks.update, {
          taskId,
          projectId,
        });

        const task = await ctx.db.get(taskId);
        expect(task!.projectId).toBe(projectId);
      });
    });

    it('should throw error if task does not exist', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const fakeTaskId = 'jh71z6b8j3n7t8v9w0x1y2z3a4b5c6d7' as Id<'tasks'>;
        await expect(
          t.mutation(api.tasks.update, {
            taskId: fakeTaskId,
            title: 'New Title',
          })
        ).rejects.toThrow('Task not found');
      });
    });

    it('should throw error if user does not own the task', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      await t.run(async (ctx) => {
        // Create task as user1
        ctx.auth = { getUserIdentity: async () => ({ subject: userId1 }) } as any;
        const taskId = await t.mutation(api.tasks.create, { title: 'Task' });

        // Try to update as user2
        ctx.auth = { getUserIdentity: async () => ({ subject: userId2 }) } as any;
        await expect(
          t.mutation(api.tasks.update, {
            taskId,
            title: 'New Title',
          })
        ).rejects.toThrow('Unauthorized');
      });
    });

    it('should throw error if title is empty after trim', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId = await t.mutation(api.tasks.create, { title: 'Task' });

        await expect(
          t.mutation(api.tasks.update, {
            taskId,
            title: '   ',
          })
        ).rejects.toThrow('Task title is required');
      });
    });

    it('should throw error if title exceeds 200 characters', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId = await t.mutation(api.tasks.create, { title: 'Task' });
        const longTitle = 'a'.repeat(201);

        await expect(
          t.mutation(api.tasks.update, {
            taskId,
            title: longTitle,
          })
        ).rejects.toThrow('Task title must be 200 characters or less');
      });
    });

    it('should update updatedAt timestamp', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId = await t.mutation(api.tasks.create, { title: 'Task' });
        const task = await ctx.db.get(taskId);
        const originalUpdatedAt = task!.updatedAt;

        // Wait a tiny bit to ensure timestamp changes
        await new Promise(resolve => setTimeout(resolve, 10));

        await t.mutation(api.tasks.update, {
          taskId,
          title: 'Updated Task',
        });

        const updatedTask = await ctx.db.get(taskId);
        expect(updatedTask!.updatedAt).toBeGreaterThan(originalUpdatedAt);
      });
    });
  });

  describe('setStatus', () => {
    it('should set task status to doing', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId = await t.mutation(api.tasks.create, { title: 'Task' });

        await t.mutation(api.tasks.setStatus, {
          taskId,
          status: 'doing',
        });

        const task = await ctx.db.get(taskId);
        expect(task!.status).toBe('doing');
      });
    });

    it('should set task status to done', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId = await t.mutation(api.tasks.create, { title: 'Task' });

        await t.mutation(api.tasks.setStatus, {
          taskId,
          status: 'done',
        });

        const task = await ctx.db.get(taskId);
        expect(task!.status).toBe('done');
      });
    });

    it('should throw error if task does not exist', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const fakeTaskId = 'jh71z6b8j3n7t8v9w0x1y2z3a4b5c6d7' as Id<'tasks'>;
        await expect(
          t.mutation(api.tasks.setStatus, {
            taskId: fakeTaskId,
            status: 'doing',
          })
        ).rejects.toThrow('Task not found');
      });
    });

    it('should throw error if user does not own the task', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      await t.run(async (ctx) => {
        // Create task as user1
        ctx.auth = { getUserIdentity: async () => ({ subject: userId1 }) } as any;
        const taskId = await t.mutation(api.tasks.create, { title: 'Task' });

        // Try to update status as user2
        ctx.auth = { getUserIdentity: async () => ({ subject: userId2 }) } as any;
        await expect(
          t.mutation(api.tasks.setStatus, {
            taskId,
            status: 'doing',
          })
        ).rejects.toThrow('Unauthorized');
      });
    });
  });

  describe('reorder', () => {
    it('should update task order', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId = await t.mutation(api.tasks.create, { title: 'Task' });

        await t.mutation(api.tasks.reorder, {
          taskId,
          order: 99,
        });

        const task = await ctx.db.get(taskId);
        expect(task!.order).toBe(99);
      });
    });

    it('should throw error if task does not exist', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const fakeTaskId = 'jh71z6b8j3n7t8v9w0x1y2z3a4b5c6d7' as Id<'tasks'>;
        await expect(
          t.mutation(api.tasks.reorder, {
            taskId: fakeTaskId,
            order: 10,
          })
        ).rejects.toThrow('Task not found');
      });
    });

    it('should throw error if user does not own the task', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      await t.run(async (ctx) => {
        // Create task as user1
        ctx.auth = { getUserIdentity: async () => ({ subject: userId1 }) } as any;
        const taskId = await t.mutation(api.tasks.create, { title: 'Task' });

        // Try to reorder as user2
        ctx.auth = { getUserIdentity: async () => ({ subject: userId2 }) } as any;
        await expect(
          t.mutation(api.tasks.reorder, {
            taskId,
            order: 10,
          })
        ).rejects.toThrow('Unauthorized');
      });
    });
  });

  describe('archive', () => {
    it('should archive a task', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const taskId = await t.mutation(api.tasks.create, { title: 'Task' });

        await t.mutation(api.tasks.archive, { taskId });

        const task = await ctx.db.get(taskId);
        expect(task!.archived).toBe(true);
      });
    });

    it('should throw error if task does not exist', async () => {
      const userId = 'user123';
      await t.run(async (ctx) => {
        ctx.auth = { getUserIdentity: async () => ({ subject: userId }) } as any;

        const fakeTaskId = 'jh71z6b8j3n7t8v9w0x1y2z3a4b5c6d7' as Id<'tasks'>;
        await expect(
          t.mutation(api.tasks.archive, { taskId: fakeTaskId })
        ).rejects.toThrow('Task not found');
      });
    });

    it('should throw error if user does not own the task', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      await t.run(async (ctx) => {
        // Create task as user1
        ctx.auth = { getUserIdentity: async () => ({ subject: userId1 }) } as any;
        const taskId = await t.mutation(api.tasks.create, { title: 'Task' });

        // Try to archive as user2
        ctx.auth = { getUserIdentity: async () => ({ subject: userId2 }) } as any;
        await expect(
          t.mutation(api.tasks.archive, { taskId })
        ).rejects.toThrow('Unauthorized');
      });
    });
  });
});
