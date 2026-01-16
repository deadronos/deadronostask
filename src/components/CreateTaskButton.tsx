'use client';

import { useMutation } from 'convex/react';
import { useState } from 'react';

import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface CreateTaskButtonProps {
  projectId?: Id<'projects'> | null;
}

export function CreateTaskButton({ projectId }: CreateTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<0 | 1 | 2 | 3>(0);
  const createTask = useMutation(api.tasks.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        projectId: projectId ?? undefined,
      });
      setTitle('');
      setDescription('');
      setPriority(0);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
      >
        Add Task
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded border bg-white p-4 shadow-lg"
    >
      <h3 className="mb-3 text-lg font-semibold">New Task</h3>
      <div className="mb-3">
        <label htmlFor="task-title" className="mb-1 block text-sm font-medium">
          Title
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="w-full rounded border px-3 py-2"
        />
      </div>
      <div className="mb-3">
        <label
          htmlFor="task-description"
          className="mb-1 block text-sm font-medium"
        >
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Task description (optional)"
          className="w-full rounded border px-3 py-2"
          rows={3}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="task-priority" className="mb-1 block text-sm font-medium">
          Priority
        </label>
        <select
          id="task-priority"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value) as 0 | 1 | 2 | 3)}
          className="w-full rounded border px-3 py-2"
        >
          <option value={0}>Low (0)</option>
          <option value={1}>Medium (1)</option>
          <option value={2}>High (2)</option>
          <option value={3}>Urgent (3)</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Create Task
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setTitle('');
            setDescription('');
            setPriority(0);
          }}
          className="rounded border px-4 py-2 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
