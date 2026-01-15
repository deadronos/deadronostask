'use client';

import { useMutation, useQuery } from 'convex/react';
import { FolderOpen, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';

const projectColorClasses: Record<string, { bg: string; text: string }> = {
  '#F97316': { bg: 'bg-orange-500/15', text: 'text-orange-500' },
  '#0EA5E9': { bg: 'bg-sky-500/15', text: 'text-sky-500' },
  '#10B981': { bg: 'bg-emerald-500/15', text: 'text-emerald-500' },
  '#8B5CF6': { bg: 'bg-violet-500/15', text: 'text-violet-500' },
  '#F43F5E': { bg: 'bg-pink-500/15', text: 'text-pink-500' },
};

export default function ProjectsPage() {
  const projects = useQuery(api.projects.list) ?? [];
  const tasks = useQuery(api.tasks.listForProjectIds, {
    projectIds: projects.map(p => p._id),
  });
  const createProject = useMutation(api.projects.create);

  const counts = new Map<string, number>();
  tasks?.forEach(task => {
    if (!task.projectId || task.isCompleted) return;
    counts.set(task.projectId, (counts.get(task.projectId) ?? 0) + 1);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-white/70 p-6 shadow-xs dark:bg-slate-950/60">
        <div>
          <h2 className="text-2xl font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">
            Navigate your workstreams and keep tasks grouped.
          </p>
        </div>
        <Button
          onClick={async () => {
            const name = window.prompt('Project name?');
            if (!name) return;
            try {
              await createProject({
                name,
                color: '#0EA5E9',
                icon: '📌',
              });
            } catch (error) {
              console.error(error);
              toast.error('Could not create project');
            }
          }}
        >
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border p-10 text-center">
          <FolderOpen className="h-6 w-6 text-muted-foreground" />
          <h3 className="mt-3 text-lg font-semibold">No projects yet</h3>
          <p className="text-sm text-muted-foreground">Create a project to group related tasks.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map(project => (
            <Link
              key={project._id}
              href={`/app/projects/${project._id}`}
              className="group rounded-2xl border border-border bg-white/80 p-5 shadow-xs transition hover:-translate-y-1 hover:shadow-lg dark:bg-slate-950/60"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'grid h-12 w-12 place-items-center rounded-2xl text-xl',
                    projectColorClasses[project.color]?.bg ?? 'bg-muted',
                    projectColorClasses[project.color]?.text ?? 'text-foreground',
                  )}
                >
                  {project.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {counts.get(project._id) ?? 0} open tasks
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
