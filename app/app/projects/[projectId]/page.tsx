"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { TaskList } from "@/components/TaskList";
import { useSearch } from "@/components/search-context";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { query } = useSearch();
  const trimmed = query.trim();
  const projects = useQuery(api.projects.list);
  const project = useMemo(
    () => projects?.find((item) => item._id === projectId),
    [projects, projectId]
  );
  const tasks = useQuery(
    trimmed ? api.tasks.search : api.tasks.listByProject,
    trimmed
      ? { query: trimmed }
      : { projectId: projectId as Id<"projects"> }
  );

  if (!project) {
    return (
      <div className="rounded-2xl border border-border bg-white/70 p-6 shadow-sm dark:bg-slate-950/60">
        <h2 className="text-2xl font-semibold">Project</h2>
        <p className="text-sm text-muted-foreground">
          Loading project details...
        </p>
      </div>
    );
  }

  return (
    <TaskList
      title={project.name}
      subtitle="Focused work for this project."
      tasks={tasks}
      projectId={project._id}
      allowReorder={!trimmed}
    />
  );
}
