'use client';

import { useQuery } from 'convex/react';
import { useParams } from 'next/navigation';

import { CreateTaskButton } from '@/components/CreateTaskButton';
import { TaskItem } from '@/components/TaskItem';
import { api } from '@/convex/_generated/api';
import { type Id } from '@/convex/_generated/dataModel';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as Id<'projects'>;

  const project = useQuery(api.projects.list, { includeArchived: false });
  const currentProject = project?.find(p => p._id === projectId);
  const tasks = useQuery(api.tasks.list, { projectId, includeArchived: false });

  if (tasks === undefined || project === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold">{currentProject.name}</h1>
            <p className="text-gray-600">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>
          <CreateTaskButton projectId={projectId} />
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          {tasks.length === 0 ? (
            <p className="text-center text-gray-500">
              No tasks in this project yet. Create your first task!
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-lg font-semibold">To Do</h3>
                <div className="space-y-3">
                  {tasks
                    .filter(t => t.status === 'todo')
                    .map(task => (
                      <TaskItem key={task._id} task={task} />
                    ))}
                  {tasks.filter(t => t.status === 'todo').length === 0 && (
                    <p className="text-sm text-gray-400">No tasks</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold">In Progress</h3>
                <div className="space-y-3">
                  {tasks
                    .filter(t => t.status === 'doing')
                    .map(task => (
                      <TaskItem key={task._id} task={task} />
                    ))}
                  {tasks.filter(t => t.status === 'doing').length === 0 && (
                    <p className="text-sm text-gray-400">No tasks</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold">Done</h3>
                <div className="space-y-3">
                  {tasks
                    .filter(t => t.status === 'done')
                    .map(task => (
                      <TaskItem key={task._id} task={task} />
                    ))}
                  {tasks.filter(t => t.status === 'done').length === 0 && (
                    <p className="text-sm text-gray-400">No tasks</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
