"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TaskList } from "@/components/TaskList";
import { useSearch } from "@/components/search-context";

export default function CompletedPage() {
  const { query } = useSearch();
  const trimmed = query.trim();
  const tasks = useQuery(
    trimmed ? api.tasks.search : api.tasks.listCompleted,
    trimmed ? { query: trimmed } : {}
  );

  return (
    <TaskList
      title="Completed"
      subtitle="Restore tasks or review what you finished."
      tasks={tasks}
    />
  );
}
