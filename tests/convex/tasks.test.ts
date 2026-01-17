import { convexTest } from 'convex-test';
import { expect, describe, it, beforeEach } from 'vitest';

import { convexModules } from '../utils/convexModules';

import { api } from '@/convex/_generated/api';
import schema from '@/convex/schema';

describe('tasks', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(async () => {
    // Point to the convex functions directory
    t = convexTest(schema, convexModules);
  });

  describe('create', () => {
    it('should create a task with required fields', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId = await user.mutation(api.tasks.create, {
        title: 'Test Task',
      });

      expect(taskId).toBeDefined();

      const task = await t.run(ctx => ctx.db.get(taskId));
      expect(task).toBeDefined();
      expect(task!.title).toBe('Test Task');
      expect(task!.ownerClerkUserId).toBe(userId);
      expect(task!.status).toBe('todo');
      expect(task!.priority).toBe(0);
      expect(task!.archived).toBe(false);
      expect(task!.order).toBe(1);
    });

    it('should create a task with all optional fields', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId = await t.run(ctx =>
        ctx.db.insert('projects', {
          ownerClerkUserId: userId,
          name: 'Test Project',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
      );

      const dueAt = Date.now() + 86400000; // Tomorrow
      const taskId = await user.mutation(api.tasks.create, {
        title: 'Complete Task',
        description: 'Task description',
        priority: 2,
        dueAt,
        projectId,
      });

      const task = await t.run(ctx => ctx.db.get(taskId));
      expect(task).toBeDefined();
      expect(task!.title).toBe('Complete Task');
      expect(task!.description).toBe('Task description');
      expect(task!.priority).toBe(2);
      expect(task!.dueAt).toBe(dueAt);
      expect(task!.projectId).toBe(projectId);
    });

    it('should trim whitespace from title', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId = await user.mutation(api.tasks.create, {
        title: '  Trimmed Task  ',
      });

      const task = await t.run(ctx => ctx.db.get(taskId));
      expect(task!.title).toBe('Trimmed Task');
    });

    it('should throw error if title is empty after trim', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      await expect(
        user.mutation(api.tasks.create, {
          title: '   ',
        }),
      ).rejects.toThrow('Task title is required');
    });

    it('should throw error if title exceeds 200 characters', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const longTitle = 'a'.repeat(201);
      await expect(
        user.mutation(api.tasks.create, {
          title: longTitle,
        }),
      ).rejects.toThrow('Task title must be 200 characters or less');
    });

    it('should throw error if projectId does not exist', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const missingProjectId = await t.run(ctx =>
        ctx.db.insert('projects', {
          ownerClerkUserId: userId,
          name: 'Missing Project',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
      );

      await t.run(ctx => ctx.db.delete(missingProjectId));

      await expect(
        user.mutation(api.tasks.create, {
          title: 'Task',
          projectId: missingProjectId,
        }),
      ).rejects.toThrow('Project not found');
    });

    it('should throw error if project belongs to different user', async () => {
      const userId = 'user123';
      const otherUserId = 'user456';
      const user = t.withIdentity({ subject: userId });

      const projectId = await t.run(ctx =>
        ctx.db.insert('projects', {
          ownerClerkUserId: otherUserId,
          name: 'Other User Project',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
      );

      await expect(
        user.mutation(api.tasks.create, {
          title: 'Task',
          projectId,
        }),
      ).rejects.toThrow('Unauthorized');
    });

    it('should increment order for subsequent tasks', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId1 = await user.mutation(api.tasks.create, {
        title: 'Task 1',
      });
      const taskId2 = await user.mutation(api.tasks.create, {
        title: 'Task 2',
      });
      const taskId3 = await user.mutation(api.tasks.create, {
        title: 'Task 3',
      });

      const task1 = await t.run(ctx => ctx.db.get(taskId1));
      const task2 = await t.run(ctx => ctx.db.get(taskId2));
      const task3 = await t.run(ctx => ctx.db.get(taskId3));

      expect(task1!.order).toBe(1);
      expect(task2!.order).toBe(2);
      expect(task3!.order).toBe(3);
    });

    it('should throw error if user is not authenticated', async () => {
      await expect(
        t.mutation(api.tasks.create, {
          title: 'Task',
        }),
      ).rejects.toThrow('Unauthenticated');
    });
  });

  describe('list', () => {
    it('should return empty array when no tasks exist', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const tasks = await user.query(api.tasks.list, {});
      expect(tasks).toEqual([]);
    });

    it('should list all user tasks by default', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      await user.mutation(api.tasks.create, { title: 'Task 1' });
      await user.mutation(api.tasks.create, { title: 'Task 2' });
      await user.mutation(api.tasks.create, { title: 'Task 3' });

      const tasks = await user.query(api.tasks.list, {});
      expect(tasks).toHaveLength(3);
    });

    it('should exclude archived tasks by default', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId1 = await user.mutation(api.tasks.create, { title: 'Task 1' });
      await user.mutation(api.tasks.create, { title: 'Task 2' });

      await user.mutation(api.tasks.archive, { taskId: taskId1 });

      const tasks = await user.query(api.tasks.list, {});
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Task 2');
    });

    it('should include archived tasks when specified', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId1 = await user.mutation(api.tasks.create, { title: 'Task 1' });
      await user.mutation(api.tasks.create, { title: 'Task 2' });

      await user.mutation(api.tasks.archive, { taskId: taskId1 });

      const tasks = await user.query(api.tasks.list, { includeArchived: true });
      expect(tasks).toHaveLength(2);
    });

    it('should filter tasks by projectId', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId1 = await t.run(ctx =>
        ctx.db.insert('projects', {
          ownerClerkUserId: userId,
          name: 'Project 1',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
      );

      const projectId2 = await t.run(ctx =>
        ctx.db.insert('projects', {
          ownerClerkUserId: userId,
          name: 'Project 2',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
      );

      await user.mutation(api.tasks.create, { title: 'Task 1', projectId: projectId1 });
      await user.mutation(api.tasks.create, { title: 'Task 2', projectId: projectId2 });
      await user.mutation(api.tasks.create, { title: 'Task 3', projectId: projectId1 });

      const tasks = await user.query(api.tasks.list, { projectId: projectId1 });
      expect(tasks).toHaveLength(2);
      expect(tasks.every(t => t.projectId === projectId1)).toBe(true);
    });

    it('should filter tasks by null projectId', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId = await t.run(ctx =>
        ctx.db.insert('projects', {
          ownerClerkUserId: userId,
          name: 'Project',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
      );

      await user.mutation(api.tasks.create, { title: 'Task 1', projectId: null });
      await user.mutation(api.tasks.create, { title: 'Task 2', projectId });

      const tasks = await user.query(api.tasks.list, { projectId: null });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Task 1');
    });

    it('should filter tasks by status', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId1 = await user.mutation(api.tasks.create, { title: 'Task 1' });
      const taskId2 = await user.mutation(api.tasks.create, { title: 'Task 2' });
      await user.mutation(api.tasks.create, { title: 'Task 3' });

      await user.mutation(api.tasks.setStatus, { taskId: taskId1, status: 'doing' });
      await user.mutation(api.tasks.setStatus, { taskId: taskId2, status: 'done' });

      const todoTasks = await user.query(api.tasks.list, { status: 'todo' });
      const doingTasks = await user.query(api.tasks.list, { status: 'doing' });
      const doneTasks = await user.query(api.tasks.list, { status: 'done' });

      expect(todoTasks).toHaveLength(1);
      expect(doingTasks).toHaveLength(1);
      expect(doneTasks).toHaveLength(1);
    });

    it('should filter tasks by search term in title', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      await user.mutation(api.tasks.create, { title: 'Buy groceries' });
      await user.mutation(api.tasks.create, { title: 'Call mom' });
      await user.mutation(api.tasks.create, { title: 'Buy tickets' });

      const tasks = await user.query(api.tasks.list, { search: 'buy' });
      expect(tasks).toHaveLength(2);
      expect(tasks.every(t => t.title.toLowerCase().includes('buy'))).toBe(true);
    });

    it('should filter tasks by search term in description', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      await user.mutation(api.tasks.create, {
        title: 'Task 1',
        description: 'Important meeting',
      });
      await user.mutation(api.tasks.create, {
        title: 'Task 2',
        description: 'Regular task',
      });

      const tasks = await user.query(api.tasks.list, { search: 'important' });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Task 1');
    });

    it('should sort tasks by order then creation time', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId1 = await user.mutation(api.tasks.create, { title: 'Task 1' });
      const taskId2 = await user.mutation(api.tasks.create, { title: 'Task 2' });
      const taskId3 = await user.mutation(api.tasks.create, { title: 'Task 3' });

      await user.mutation(api.tasks.reorder, { taskId: taskId2, order: 10 });

      const tasks = await user.query(api.tasks.list, {});
      expect(tasks[0]._id).toBe(taskId1);
      expect(tasks[1]._id).toBe(taskId3);
      expect(tasks[2]._id).toBe(taskId2);
    });

    it('should not return tasks from other users', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      const user1 = t.withIdentity({ subject: userId1 });
      const user2 = t.withIdentity({ subject: userId2 });

      await user1.mutation(api.tasks.create, { title: 'User1 Task' });
      await user2.mutation(api.tasks.create, { title: 'User2 Task' });

      const tasks = await user2.query(api.tasks.list, {});
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('User2 Task');
    });
  });

  describe('update', () => {
    it('should update task title', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId = await user.mutation(api.tasks.create, { title: 'Old Title' });

      await user.mutation(api.tasks.update, {
        taskId,
        title: 'New Title',
      });

      const task = await t.run(ctx => ctx.db.get(taskId));
      expect(task!.title).toBe('New Title');
    });

    it('should update task description', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId = await user.mutation(api.tasks.create, { title: 'Task' });

      await user.mutation(api.tasks.update, {
        taskId,
        description: 'New description',
      });

      const task = await t.run(ctx => ctx.db.get(taskId));
      expect(task!.description).toBe('New description');
    });

    it('should update task priority', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId = await user.mutation(api.tasks.create, { title: 'Task', priority: 0 });

      await user.mutation(api.tasks.update, {
        taskId,
        priority: 3,
      });

      const task = await t.run(ctx => ctx.db.get(taskId));
      expect(task!.priority).toBe(3);
    });

    it('should update task dueAt', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId = await user.mutation(api.tasks.create, { title: 'Task' });
      const newDueAt = Date.now() + 86400000;

      await user.mutation(api.tasks.update, {
        taskId,
        dueAt: newDueAt,
      });

      const task = await t.run(ctx => ctx.db.get(taskId));
      expect(task!.dueAt).toBe(newDueAt);
    });

    it('should clear task dueAt when set to null', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const dueAt = Date.now() + 86400000;
      const taskId = await user.mutation(api.tasks.create, { title: 'Task', dueAt });

      await user.mutation(api.tasks.update, {
        taskId,
        dueAt: null,
      });

      const task = await t.run(ctx => ctx.db.get(taskId));
      expect(task!.dueAt).toBeNull();
    });

    it('should update task projectId', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId = await t.run(ctx =>
        ctx.db.insert('projects', {
          ownerClerkUserId: userId,
          name: 'Project',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
      );

      const taskId = await user.mutation(api.tasks.create, { title: 'Task' });

      await user.mutation(api.tasks.update, {
        taskId,
        projectId,
      });

      const task = await t.run(ctx => ctx.db.get(taskId));
      expect(task!.projectId).toBe(projectId);
    });

    it('should clear task projectId when set to null', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const projectId = await t.run(ctx =>
        ctx.db.insert('projects', {
          ownerClerkUserId: userId,
          name: 'Project',
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
      );

      const taskId = await user.mutation(api.tasks.create, { title: 'Task', projectId });

      await user.mutation(api.tasks.update, {
        taskId,
        projectId: null,
      });

      const task = await t.run(ctx => ctx.db.get(taskId));
      expect(task!.projectId).toBeNull();
    });

    it('should throw error if task does not exist', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const missingTaskId = await user.mutation(api.tasks.create, { title: 'Missing Task' });
      await t.run(ctx => ctx.db.delete(missingTaskId));

      await expect(
        user.mutation(api.tasks.update, {
          taskId: missingTaskId,
          title: 'New Title',
        }),
      ).rejects.toThrow('Task not found');
    });

    it('should throw error if user does not own the task', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      const user1 = t.withIdentity({ subject: userId1 });
      const user2 = t.withIdentity({ subject: userId2 });

      const taskId = await user1.mutation(api.tasks.create, { title: 'Task' });

      await expect(
        user2.mutation(api.tasks.update, {
          taskId,
          title: 'New Title',
        }),
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw error if title is empty after trim', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId = await user.mutation(api.tasks.create, { title: 'Task' });

      await expect(
        user.mutation(api.tasks.update, {
          taskId,
          title: '   ',
        }),
      ).rejects.toThrow('Task title is required');
    });

    it('should throw error if title exceeds 200 characters', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId = await user.mutation(api.tasks.create, { title: 'Task' });
      const longTitle = 'a'.repeat(201);

      await expect(
        user.mutation(api.tasks.update, {
          taskId,
          title: longTitle,
        }),
      ).rejects.toThrow('Task title must be 200 characters or less');
    });

    it('should update updatedAt timestamp', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId = await user.mutation(api.tasks.create, { title: 'Task' });
      const task = await t.run(ctx => ctx.db.get(taskId));
      const originalUpdatedAt = task!.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      await user.mutation(api.tasks.update, {
        taskId,
        title: 'Updated Task',
      });

      const updatedTask = await t.run(ctx => ctx.db.get(taskId));
      expect(updatedTask!.updatedAt).toBeGreaterThan(originalUpdatedAt);
    });
  });

  describe('setStatus', () => {
    it('should set task status to doing', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId = await user.mutation(api.tasks.create, { title: 'Task' });

      await user.mutation(api.tasks.setStatus, {
        taskId,
        status: 'doing',
      });

      const task = await t.run(ctx => ctx.db.get(taskId));
      expect(task!.status).toBe('doing');
    });

    it('should set task status to done', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId = await user.mutation(api.tasks.create, { title: 'Task' });

      await user.mutation(api.tasks.setStatus, {
        taskId,
        status: 'done',
      });

      const task = await t.run(ctx => ctx.db.get(taskId));
      expect(task!.status).toBe('done');
    });

    it('should throw error if task does not exist', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const missingTaskId = await user.mutation(api.tasks.create, { title: 'Missing Task' });
      await t.run(ctx => ctx.db.delete(missingTaskId));

      await expect(
        user.mutation(api.tasks.setStatus, {
          taskId: missingTaskId,
          status: 'doing',
        }),
      ).rejects.toThrow('Task not found');
    });

    it('should throw error if user does not own the task', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      const user1 = t.withIdentity({ subject: userId1 });
      const user2 = t.withIdentity({ subject: userId2 });

      const taskId = await user1.mutation(api.tasks.create, { title: 'Task' });

      await expect(
        user2.mutation(api.tasks.setStatus, {
          taskId,
          status: 'doing',
        }),
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('reorder', () => {
    it('should update task order', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId = await user.mutation(api.tasks.create, { title: 'Task' });

      await user.mutation(api.tasks.reorder, {
        taskId,
        order: 99,
      });

      const task = await t.run(ctx => ctx.db.get(taskId));
      expect(task!.order).toBe(99);
    });

    it('should throw error if task does not exist', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const missingTaskId = await user.mutation(api.tasks.create, { title: 'Missing Task' });
      await t.run(ctx => ctx.db.delete(missingTaskId));

      await expect(
        user.mutation(api.tasks.reorder, {
          taskId: missingTaskId,
          order: 10,
        }),
      ).rejects.toThrow('Task not found');
    });

    it('should throw error if user does not own the task', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      const user1 = t.withIdentity({ subject: userId1 });
      const user2 = t.withIdentity({ subject: userId2 });

      const taskId = await user1.mutation(api.tasks.create, { title: 'Task' });

      await expect(
        user2.mutation(api.tasks.reorder, {
          taskId,
          order: 10,
        }),
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('archive', () => {
    it('should archive a task', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const taskId = await user.mutation(api.tasks.create, { title: 'Task' });

      await user.mutation(api.tasks.archive, { taskId });

      const task = await t.run(ctx => ctx.db.get(taskId));
      expect(task!.archived).toBe(true);
    });

    it('should throw error if task does not exist', async () => {
      const userId = 'user123';
      const user = t.withIdentity({ subject: userId });

      const missingTaskId = await user.mutation(api.tasks.create, { title: 'Missing Task' });
      await t.run(ctx => ctx.db.delete(missingTaskId));

      await expect(user.mutation(api.tasks.archive, { taskId: missingTaskId })).rejects.toThrow(
        'Task not found',
      );
    });

    it('should throw error if user does not own the task', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      const user1 = t.withIdentity({ subject: userId1 });
      const user2 = t.withIdentity({ subject: userId2 });

      const taskId = await user1.mutation(api.tasks.create, { title: 'Task' });

      await expect(user2.mutation(api.tasks.archive, { taskId })).rejects.toThrow('Unauthorized');
    });
  });

  describe('labels', () => {
    it('should create task with labels', async () => {
      const user = t.withIdentity({ subject: 'u1' });
      const labelId = await user.mutation(api.labels.create, { name: 'Bug', color: '#f00' });

      const _taskId = await user.mutation(api.tasks.create, {
        title: 'Task',
        labelIds: [labelId],
      });

      const task = await user.query(api.tasks.list, {});
      expect(task[0].labelIds).toEqual([labelId]);
    });

    it('should filter tasks by labels', async () => {
      const user = t.withIdentity({ subject: 'u1' });
      const l1 = await user.mutation(api.labels.create, { name: 'L1', color: '#f00' });
      const l2 = await user.mutation(api.labels.create, { name: 'L2', color: '#0f0' });

      await user.mutation(api.tasks.create, { title: 'T1', labelIds: [l1] });
      await user.mutation(api.tasks.create, { title: 'T2', labelIds: [l2] });
      await user.mutation(api.tasks.create, { title: 'T3', labelIds: [l1, l2] });
      await user.mutation(api.tasks.create, { title: 'T4' }); // No labels

      const res1 = await user.query(api.tasks.list, { labelIds: [l1] });
      expect(res1).toHaveLength(2); // T1, T3

      const res2 = await user.query(api.tasks.list, { labelIds: [l1, l2] });
      expect(res2).toHaveLength(3); // T1, T2, T3 (OR logic)
    });

    it('should update task labels', async () => {
      const user = t.withIdentity({ subject: 'u1' });
      const l1 = await user.mutation(api.labels.create, { name: 'L1', color: '#f00' });
      const l2 = await user.mutation(api.labels.create, { name: 'L2', color: '#0f0' });

      const taskId = await user.mutation(api.tasks.create, { title: 'Task', labelIds: [l1] });

      await user.mutation(api.tasks.update, {
        taskId,
        labelIds: [l2],
      });

      const tasks = await user.query(api.tasks.list, {});
      expect(tasks[0].labelIds).toEqual([l2]);
    });
  });
});
