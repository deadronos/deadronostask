'use client';

import { useQuery } from 'convex/react';
import { useParams } from 'next/navigation';

import { api } from '@/convex/_generated/api';
import { type Id } from '@/convex/_generated/dataModel';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as Id<'projects'>;

  const tasks = useQuery(api.tasks.list, { projectId, includeArchived: false });

  if (tasks === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-4xl font-bold">Project Tasks</h1>

        <div className="rounded-lg bg-white p-6 shadow">
          {tasks.length === 0 ? (
            <p className="text-gray-500">No tasks in this project yet.</p>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task._id} className="rounded border p-4 hover:bg-gray-50">
                  <h3 className="font-semibold">{task.title}</h3>
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                  )}
                  <div className="mt-2 flex gap-4 text-sm text-gray-500">
                    <span>Status: {task.status}</span>
                    <span>Priority: {task.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
