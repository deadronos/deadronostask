"use client";

import Link from "next/link";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

const colors = ["#F97316", "#0EA5E9", "#10B981", "#8B5CF6", "#F43F5E"];
const icons = ["📌", "🧭", "🧩", "🎯", "🪴"];

export function ProjectList() {
  const projects = useQuery(api.projects.list) ?? [];
  const createProject = useMutation(api.projects.create);
  const renameProject = useMutation(api.projects.rename);
  const reorder = useMutation(api.projects.reorder);
  const remove = useMutation(api.projects.remove);

  const handleAdd = async () => {
    const name = window.prompt("Project name?");
    if (!name) return;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    await createProject({ name, color, icon });
  };

  const handleRename = async (id: Id<"projects">, current: string) => {
    const name = window.prompt("Rename project", current);
    if (!name || name === current) return;
    await renameProject({ id, name });
  };

  const handleMove = async (from: number, to: number) => {
    if (to < 0 || to >= projects.length) return;
    const ordered = [...projects];
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    await reorder({ orderedIds: ordered.map((p) => p._id) });
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
        {projects.length === 0 && (
          <p className="text-xs text-muted-foreground">No projects yet.</p>
        )}
        {projects.map((project, index) => (
          <div
            key={project._id}
            className="flex items-center gap-2 rounded-lg border border-border/60 px-2 py-2"
          >
            <span
              className="grid h-8 w-8 place-items-center rounded-lg text-sm"
              style={{ backgroundColor: `${project.color}22`, color: project.color }}
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
                className={cn(index === 0 && "opacity-40")}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleMove(index, index + 1)}
                className={cn(index === projects.length - 1 && "opacity-40")}
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
                  if (window.confirm("Delete project?")) {
                    remove({ id: project._id });
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
