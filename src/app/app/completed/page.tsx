'use client';

import { useQuery } from 'convex/react';

import { useSearch } from '@/components/search-context';
import { TaskList } from '@/components/TaskList';
import { api } from '@/convex/_generated/api';

export default function CompletedPage() {
  const { query } = useSearch();
  const trimmed = query.trim();
  // Call both hooks in a stable order and skip the search when there is no query
  const searchResults = useQuery(api.tasks.search, trimmed ? { query: trimmed } : 'skip');
  const completed = useQuery(api.tasks.listCompleted);
  const tasks = trimmed ? searchResults : completed;

  return (
    <TaskList
      title="Completed"
      subtitle="Restore tasks or review what you finished."
      tasks={tasks}
    />
  );
}
