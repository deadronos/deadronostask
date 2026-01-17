'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { ListTodo, CheckCircle2, Clock, LayoutGrid, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { CreateProjectButton } from '@/components/create-project-button';
import { CreateTaskButton } from '@/components/create-task-button';
import { TaskItem } from '@/components/task-item';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/convex/_generated/api';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();

  // Only run Convex queries when user is authenticated
  // Pass "skip" to prevent queries from running when user is not loaded or not authenticated
  const currentUser = useQuery(api.users.getMe, !isLoaded || !user ? 'skip' : {});
  const upsertMe = useMutation(api.users.upsertMe);
  const projects = useQuery(
    api.projects.list,
    !isLoaded || !user ? 'skip' : { includeArchived: false },
  );
  const tasks = useQuery(api.tasks.list, !isLoaded || !user ? 'skip' : { includeArchived: false });

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

  const completedTasks = tasks?.filter(t => t.status === 'done').length ?? 0;
  const pendingTasks = tasks?.filter(t => t.status !== 'done').length ?? 0;
  const activeProjects = projects?.length ?? 0;

  function renderProjectsContent() {
    if (projects === undefined) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading projects...</div>
        </div>
      );
    }
    if (projects.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center space-y-3 py-8 text-center">
          <LayoutGrid className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No projects yet. Create your first project!
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {projects.map(project => (
          <Link
            key={project._id}
            href={`/projects/${project._id}`}
            className="group flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 p-4 transition hover:border-primary/40 hover:bg-card"
          >
            <div className="space-y-1">
              <div className="font-medium text-foreground">{project.name}</div>
              <div className="text-xs text-muted-foreground">Project hub</div>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
          </Link>
        ))}
      </div>
    );
  }

  function renderTasksContent() {
    if (tasks === undefined) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading tasks...</div>
        </div>
      );
    }
    if (tasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center space-y-3 py-8 text-center">
          <ListTodo className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No tasks yet. Create your first task!</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {tasks.slice(0, 5).map(task => (
          <TaskItem key={task._id} task={task} />
        ))}
      </div>
    );
  }

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
      <div className="container relative mx-auto space-y-10 px-4 py-10">
        {/* Header */}
        <section className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_30px_60px_-45px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Daily Pulse
              </span>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Dashboard
              </h1>
              <p className="max-w-xl text-base text-muted-foreground">
                Welcome back, {user.firstName || 'there'}! Here&apos;s your live snapshot for today.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <CreateProjectButton />
              <CreateTaskButton projectId={undefined} />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-sm">
              <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                Active Projects
                <LayoutGrid className="h-4 w-4" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-foreground">{activeProjects}</span>
                <span className="text-xs text-muted-foreground">
                  {activeProjects === 1 ? 'project' : 'projects'} in flight
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-sm">
              <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                Completed Tasks
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-foreground">{completedTasks}</span>
                <span className="text-xs text-muted-foreground">
                  {tasks?.length ? `${Math.round((completedTasks / tasks.length) * 100)}%` : '0%'}{' '}
                  completion
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-sm">
              <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                Pending Tasks
                <Clock className="h-4 w-4" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-foreground">{pendingTasks}</span>
                <span className="text-xs text-muted-foreground">
                  {pendingTasks === 1 ? 'task' : 'tasks'} to clear
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          {/* Projects Card */}
          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold">Projects</CardTitle>
                  <CardDescription>Keep an eye on your active streams.</CardDescription>
                </div>
                <Link
                  href="/projects"
                  className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary/60 hover:text-primary"
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>{renderProjectsContent()}</CardContent>
          </Card>

          {/* Recent Tasks Card */}
          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold">Recent Tasks</CardTitle>
                  <CardDescription>Your latest work across projects.</CardDescription>
                </div>
                <ListTodo className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>{renderTasksContent()}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
