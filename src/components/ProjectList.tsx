'use client';

import { useMutation, useQuery } from 'convex/react';
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from './ui/button';

import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';

const colors = ['#F97316', '#0EA5E9', '#10B981', '#8B5CF6', '#F43F5E'];
const icons = ['📌', '🧭', '🧩', '🎯', '🪴'];

const projectColorClasses: Record<string, { bg: string; text: string }> = {
  '#F97316': { bg: 'bg-orange-500/15', text: 'text-orange-500' },
  '#0EA5E9': { bg: 'bg-sky-500/15', text: 'text-sky-500' },
  '#10B981': { bg: 'bg-emerald-500/15', text: 'text-emerald-500' },
  '#8B5CF6': { bg: 'bg-violet-500/15', text: 'text-violet-500' },
  '#F43F5E': { bg: 'bg-pink-500/15', text: 'text-pink-500' },
};

export function ProjectList() {
  const projects = useQuery(api.projects.list) ?? [];
  const createProject = useMutation(api.projects.create);
  const renameProject = useMutation(api.projects.rename);
  const reorder = useMutation(api.projects.reorder);
  const remove = useMutation(api.projects.remove);

  const handleAdd = async () => {
    const name = window.prompt('Project name?');
    if (!name) return;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    try {
      await createProject({ name, color, icon });
    } catch (error) {
      console.error(error);
      toast.error('Could not create project');
    }
  };

  const handleRename = async (id: Id<'projects'>, current: string) => {
    const name = window.prompt('Rename project', current);
    if (!name || name === current) return;
    try {
      await renameProject({ id, name });
    } catch (error) {
      console.error(error);
      toast.error('Could not rename project');
    }
  };

  const handleMove = async (from: number, to: number) => {
    if (to < 0 || to >= projects.length) return;
    const ordered = [...projects];
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    try {
      await reorder({ orderedIds: ordered.map(p => p._id) });
    } catch (error) {
      console.error(error);
      toast.error('Could not reorder projects');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-white/70 p-4 shadow-xs dark:bg-slate-950/60">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Projects</h3>
        <Button size="sm" variant="ghost" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add project</span>
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        {projects.length === 0 && <p className="text-xs text-muted-foreground">No projects yet.</p>}
        {projects.map((project, index) => (
          <div
            key={project._id}
            className="flex items-center gap-2 rounded-lg border border-border/60 px-2 py-2"
          >
            <span
              className={cn(
                'grid h-8 w-8 place-items-center rounded-lg text-sm',
                projectColorClasses[project.color]?.bg ?? 'bg-muted',
                projectColorClasses[project.color]?.text ?? 'text-foreground',
              )}
            >
              {project.icon}
            </span>
            <div className="min-w-0 flex-1">
              <Link
                href={`/app/projects/${project._id}`}
                className="truncate text-sm font-medium hover:underline"
              >
                {project.name}
              </Link>
              <div className="text-xs text-muted-foreground">Order {project.order}</div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleMove(index, index - 1)}
                className={cn(index === 0 && 'opacity-40')}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleMove(index, index + 1)}
                className={cn(index === projects.length - 1 && 'opacity-40')}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRename(project._id, project.name)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (window.confirm('Delete project?')) {
                    remove({ id: project._id }).catch(error => {
                      console.error(error);
                      toast.error('Could not delete project');
                    });
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
