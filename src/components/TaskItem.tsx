'use client';

import { useMutation } from 'convex/react';

import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface TaskItemProps {
  task: {
    _id: Id<'tasks'>;
    title: string;
    description?: string;
    status: 'todo' | 'doing' | 'done';
    priority: 0 | 1 | 2 | 3;
    dueAt?: number;
  };
}

export function TaskItem({ task }: TaskItemProps) {
  const setStatus = useMutation(api.tasks.setStatus);
  const archiveTask = useMutation(api.tasks.archive);

  const priorityColors = {
    0: 'bg-gray-100 text-gray-700',
    1: 'bg-blue-100 text-blue-700',
    2: 'bg-orange-100 text-orange-700',
    3: 'bg-red-100 text-red-700',
  };

  const priorityLabels = {
    0: 'Low',
    1: 'Medium',
    2: 'High',
    3: 'Urgent',
  };

  const statusColors = {
    todo: 'border-l-gray-400',
    doing: 'border-l-blue-500',
    done: 'border-l-green-500',
  };

  return (
    <div
      className={`rounded border-l-4 bg-white p-4 shadow hover:shadow-md ${statusColors[task.status]}`}
    >
      <div className="mb-2 flex items-start justify-between">
        <h4 className="font-semibold">{task.title}</h4>
        <span
          className={`rounded px-2 py-1 text-xs ${priorityColors[task.priority]}`}
        >
          {priorityLabels[task.priority]}
        </span>
      </div>

      {task.description && (
        <p className="mb-3 text-sm text-gray-600">{task.description}</p>
      )}

      <div className="flex items-center gap-2">
        <select
          value={task.status}
          onChange={(e) =>
            setStatus({
              taskId: task._id,
              status: e.target.value as 'todo' | 'doing' | 'done',
            })
          }
          className="rounded border px-2 py-1 text-sm"
        >
          <option value="todo">To Do</option>
          <option value="doing">In Progress</option>
          <option value="done">Done</option>
        </select>

        <button
          onClick={() => archiveTask({ taskId: task._id })}
          className="ml-auto text-sm text-red-600 hover:text-red-800"
        >
          Archive
        </button>
      </div>
    </div>
  );
}
