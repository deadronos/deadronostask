"use client";

import Link from "next/link";
import { FolderOpen, Plus } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

export default function ProjectsPage() {
  const projects = useQuery(api.projects.list) ?? [];
  const tasks = useQuery(api.tasks.listForProjectIds, {
    projectIds: projects.map((p) => p._id)
  });
  const createProject = useMutation(api.projects.create);

  const counts = new Map<string, number>();
  tasks?.forEach((task) => {
    if (!task.projectId || task.isCompleted) return;
    counts.set(task.projectId, (counts.get(task.projectId) ?? 0) + 1);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-white/70 p-6 shadow-sm dark:bg-slate-950/60">
        <div>
          <h2 className="text-2xl font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">
            Navigate your workstreams and keep tasks grouped.
          </p>
        </div>
        <Button
          onClick={async () => {
            const name = window.prompt("Project name?");
            if (!name) return;
            await createProject({
              name,
              color: "#0EA5E9",
              icon: "📌"
            });
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
          <p className="text-sm text-muted-foreground">
            Create a project to group related tasks.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project._id}
              href={`/app/projects/${project._id}`}
              className="group rounded-2xl border border-border bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:bg-slate-950/60"
            >
              <div className="flex items-center gap-3">
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl text-xl"
                  style={{ backgroundColor: `${project.color}22`, color: project.color }}
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
