'use client';

import { useMutation } from 'convex/react';
import { useState } from 'react';

import { api } from '@/convex/_generated/api';

export function CreateProjectButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const createProject = useMutation(api.projects.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createProject({ name: name.trim() });
      setName('');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Create Project
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded border bg-white p-4 shadow">
      <h3 className="mb-2 font-semibold">New Project</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name"
        className="mb-2 w-full rounded border px-3 py-2"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Create
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setName('');
          }}
          className="rounded border px-4 py-2 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
