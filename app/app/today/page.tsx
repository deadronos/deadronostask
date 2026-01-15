"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TaskList } from "@/components/TaskList";
import { useSearch } from "@/components/search-context";

export default function TodayPage() {
  const { query } = useSearch();
  const trimmed = query.trim();
  const tasks = useQuery(
    trimmed ? api.tasks.search : api.tasks.listToday,
    trimmed ? { query: trimmed } : {}
  );

  return (
    <TaskList
      title="Today"
      subtitle="Due today and overdue tasks."
      tasks={tasks}
    />
  );
}
