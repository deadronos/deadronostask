'use client';

import { useQuery } from 'convex/react';

import { useSearch } from '@/components/search-context';
import { TaskList } from '@/components/TaskList';
import { api } from '@/convex/_generated/api';

export default function InboxPage() {
  const { query } = useSearch();
  const trimmed = query.trim();
  // Call both hooks unconditionally; skip the search when there's no query
  const searchResults = useQuery(api.tasks.search, trimmed ? { query: trimmed } : 'skip');
  const inbox = useQuery(api.tasks.listInbox);
  const tasks = trimmed ? searchResults : inbox;

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
