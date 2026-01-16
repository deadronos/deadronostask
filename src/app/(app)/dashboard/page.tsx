'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { useEffect } from 'react';

import { api } from '@/convex/_generated/api';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getMe);
  const upsertMe = useMutation(api.users.upsertMe);
  const projects = useQuery(api.projects.list, { includeArchived: false });
  const tasks = useQuery(api.tasks.list, { includeArchived: false });

  // Ensure user exists in Convex DB
  useEffect(() => {
    if (isLoaded && user && currentUser === null) {
      upsertMe({
        email: user.emailAddresses[0]?.emailAddress,
        name: user.fullName ?? undefined,
        avatarUrl: user.imageUrl,
      });
    }
  }, [isLoaded, user, currentUser, upsertMe]);

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-4xl font-bold">Dashboard</h1>

        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Welcome, {user.firstName}!</h2>
          <p className="text-gray-600">This is your task management dashboard.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-xl font-semibold">Projects</h3>
            {projects === undefined ? (
              <p>Loading projects...</p>
            ) : projects.length === 0 ? (
              <p className="text-gray-500">No projects yet. Create your first project!</p>
            ) : (
              <ul className="space-y-2">
                {projects.map(project => (
                  <li key={project._id} className="border-b py-2 last:border-b-0">
                    {project.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-xl font-semibold">Recent Tasks</h3>
            {tasks === undefined ? (
              <p>Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="text-gray-500">No tasks yet. Create your first task!</p>
            ) : (
              <ul className="space-y-2">
                {tasks.slice(0, 5).map(task => (
                  <li key={task._id} className="border-b py-2 last:border-b-0">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-gray-500">
                      Status: {task.status} | Priority: {task.priority}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="mb-2 text-lg font-semibold">Quick Stats</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-3xl font-bold text-blue-600">{projects?.length ?? 0}</div>
              <div className="text-sm text-gray-600">Active Projects</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {tasks?.filter(t => t.status === 'done').length ?? 0}
              </div>
              <div className="text-sm text-gray-600">Completed Tasks</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-600">
                {tasks?.filter(t => t.status !== 'done').length ?? 0}
              </div>
              <div className="text-sm text-gray-600">Pending Tasks</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
