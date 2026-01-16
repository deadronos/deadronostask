'use client';

import { useQuery } from 'convex/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ListTodo, Clock, CheckCircle2 } from 'lucide-react';

import { CreateTaskButton } from '@/components/CreateTaskButton';
import { TaskItem } from '@/components/TaskItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { type Id } from '@/convex/_generated/dataModel';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as Id<'projects'>;

  const project = useQuery(api.projects.list, { includeArchived: false });
  const currentProject = project?.find((p) => p._id === projectId);
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

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const doingTasks = tasks.filter((t) => t.status === 'doing');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mb-2 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-4xl font-bold tracking-tight">{currentProject.name}</h1>
            <p className="text-muted-foreground">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} •{' '}
              {doneTasks.length} completed
            </p>
          </div>
          <CreateTaskButton projectId={projectId} />
        </div>

        {/* Task Board */}
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-16">
              <ListTodo className="h-16 w-16 text-muted-foreground/50" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">No tasks yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first task to get started
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* To Do Column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ListTodo className="h-5 w-5 text-muted-foreground" />
                  To Do
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {todoTasks.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todoTasks.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No tasks
                  </p>
                ) : (
                  todoTasks.map((task) => <TaskItem key={task._id} task={task} />)
                )}
              </CardContent>
            </Card>

            {/* In Progress Column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  In Progress
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {doingTasks.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {doingTasks.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No tasks
                  </p>
                ) : (
                  doingTasks.map((task) => <TaskItem key={task._id} task={task} />)
                )}
              </CardContent>
            </Card>

            {/* Done Column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Done
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {doneTasks.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {doneTasks.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No tasks
                  </p>
                ) : (
                  doneTasks.map((task) => <TaskItem key={task._id} task={task} />)
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
