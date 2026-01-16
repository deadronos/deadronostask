'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { FolderOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { CreateProjectButton } from '@/components/CreateProjectButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/convex/_generated/api';

export default function ProjectsPage() {
  const { user, isLoaded } = useUser();
  const projects = useQuery(
    api.projects.list,
    !isLoaded || !user ? 'skip' : { includeArchived: false },
  );

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
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
      <div className="container relative mx-auto space-y-8 px-4 py-10">
        <section className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_30px_60px_-45px_rgba(15,23,42,0.45)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Project Center
            </span>
            <h1 className="font-display text-4xl font-semibold tracking-tight">Projects</h1>
            <p className="max-w-xl text-muted-foreground">
              Build a clean, focused space for every initiative you&apos;re running.
            </p>
          </div>
          <CreateProjectButton />
        </section>

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold">All projects</CardTitle>
              <CardDescription>Jump into a project or start a new one.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              {projects?.length ?? 0} active
            </div>
          </CardHeader>
          <CardContent>
            {projects === undefined ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-sm text-muted-foreground">Loading projects...</div>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-12 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No projects yet. Create your first project!
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map(project => (
                  <Link
                    key={project._id}
                    href={`/projects/${project._id}`}
                    className="group rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm transition hover:border-primary/40 hover:bg-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="text-lg font-semibold text-foreground">{project.name}</div>
                        <p className="text-sm text-muted-foreground">
                          Stay aligned with milestones and daily progress updates.
                        </p>
                      </div>
                      <span className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition group-hover:border-primary/60 group-hover:text-primary">
                        View
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
