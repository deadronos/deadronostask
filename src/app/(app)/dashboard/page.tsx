'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import Link from 'next/link';
import { useEffect } from 'react';

import { CreateProjectButton } from '@/components/CreateProjectButton';
import { CreateTaskButton } from '@/components/CreateTaskButton';
import { TaskItem } from '@/components/TaskItem';
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.firstName || 'there'}!</p>
          </div>
          <div className="flex gap-3">
            <CreateProjectButton />
            <CreateTaskButton projectId={null} />
          </div>
        </div>

        <div className="mb-8 rounded-lg bg-blue-50 p-6">
          <h3 className="mb-4 text-lg font-semibold">Quick Stats</h3>
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
                    <Link
                      href={`/projects/${project._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {project.name}
                    </Link>
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
              <div className="space-y-3">
                {tasks.slice(0, 5).map(task => (
                  <TaskItem key={task._id} task={task} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
