'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { ArrowLeft, CheckCircle2, Clock, ListTodo } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { CreateTaskButton } from '@/components/CreateTaskButton';
import { TaskItem } from '@/components/TaskItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/convex/_generated/api';
import { type Id } from '@/convex/_generated/dataModel';

export default function ProjectPage() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const projectId = params.projectId as Id<'projects'>;

  // Guard Convex queries - only run when user is authenticated
  const project = useQuery(
    api.projects.list,
    !isLoaded || !user ? 'skip' : { includeArchived: false },
  );
  const currentProject = project?.find(p => p._id === projectId);
  const tasks = useQuery(
    api.tasks.list,
    !isLoaded || !user ? 'skip' : { projectId, includeArchived: false },
  );

  if (!isLoaded || !user || tasks === undefined || project === undefined) {
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

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const doingTasks = tasks.filter(t => t.status === 'doing');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(30,42,94,0.18),_transparent_55%),radial-gradient(circle_at_20%_20%,_rgba(244,220,194,0.5),_transparent_45%)]">
      <div
        className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-accent/60 blur-3xl"
        aria-hidden="true"
      />
      <div className="container relative mx-auto space-y-6 px-4 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_30px_60px_-45px_rgba(15,23,42,0.45)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mb-2 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="font-display text-4xl font-semibold tracking-tight">
              {currentProject.name}
            </h1>
            <p className="text-muted-foreground">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} • {doneTasks.length} completed
            </p>
          </div>
          <CreateTaskButton projectId={projectId} />
        </div>

        {/* Task Board */}
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
              <ListTodo className="h-16 w-16 text-muted-foreground/50" />
              <div>
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
                  <p className="py-8 text-center text-sm text-muted-foreground">No tasks</p>
                ) : (
                  todoTasks.map(task => <TaskItem key={task._id} task={task} />)
                )}
              </CardContent>
            </Card>

            {/* In Progress Column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  In Progress
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {doingTasks.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {doingTasks.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No tasks</p>
                ) : (
                  doingTasks.map(task => <TaskItem key={task._id} task={task} />)
                )}
              </CardContent>
            </Card>

            {/* Done Column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Done
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {doneTasks.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {doneTasks.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No tasks</p>
                ) : (
                  doneTasks.map(task => <TaskItem key={task._id} task={task} />)
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
