'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  LayoutGrid,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { CreateProjectButton } from '@/components/CreateProjectButton';
import { CreateTaskButton } from '@/components/CreateTaskButton';
import { TaskItem } from '@/components/TaskItem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/convex/_generated/api';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  
  // Only run Convex queries when user is authenticated
  // Pass "skip" to prevent queries from running when user is not loaded or not authenticated
  const currentUser = useQuery(
    api.users.getMe,
    !isLoaded || !user ? 'skip' : {},
  );
  const upsertMe = useMutation(api.users.upsertMe);
  const projects = useQuery(
    api.projects.list,
    !isLoaded || !user ? 'skip' : { includeArchived: false },
  );
  const tasks = useQuery(
    api.tasks.list,
    !isLoaded || !user ? 'skip' : { includeArchived: false },
  );

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

  const completedTasks = tasks?.filter((t) => t.status === 'done').length ?? 0;
  const pendingTasks = tasks?.filter((t) => t.status !== 'done').length ?? 0;
  const activeProjects = projects?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user.firstName || 'there'}! Here&apos;s what&apos;s happening today.
            </p>
          </div>
          <div className="flex gap-3">
            <CreateProjectButton />
            <CreateTaskButton projectId={null} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                {activeProjects === 1 ? 'project' : 'projects'} in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                {tasks?.length ? `${Math.round((completedTasks / tasks.length) * 100)}%` : '0%'} completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks}</div>
              <p className="text-xs text-muted-foreground">
                {pendingTasks === 1 ? 'task' : 'tasks'} to complete
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Projects Card */}
          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>Your active projects</CardDescription>
                </div>
                <LayoutGrid className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {projects === undefined ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading projects...</div>
                </div>
              ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-8">
                  <LayoutGrid className="h-12 w-12 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No projects yet. Create your first project!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <Link
                      key={project._id}
                      href={`/projects/${project._id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                    >
                      <div className="font-medium">{project.name}</div>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tasks Card */}
          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Tasks</CardTitle>
                  <CardDescription>Your latest tasks</CardDescription>
                </div>
                <ListTodo className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {tasks === undefined ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading tasks...</div>
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-8">
                  <ListTodo className="h-12 w-12 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No tasks yet. Create your first task!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <TaskItem key={task._id} task={task} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
