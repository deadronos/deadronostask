"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TaskList } from "@/components/TaskList";
import { useSearch } from "@/components/search-context";

export default function InboxPage() {
  const { query } = useSearch();
  const trimmed = query.trim();
  const tasks = useQuery(
    trimmed ? api.tasks.search : api.tasks.listInbox,
    trimmed ? { query: trimmed } : {}
  );

  return (
    <TaskList
      title="Inbox"
      subtitle="Your unassigned tasks live here."
      tasks={tasks}
      projectId={null}
      allowReorder={!trimmed}
    />
  );
}
