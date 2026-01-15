'use client';

import { useQuery } from 'convex/react';

import { useSearch } from '@/components/search-context';
import { TaskList } from '@/components/TaskList';
import { api } from '@/convex/_generated/api';

export default function CompletedPage() {
  const { query } = useSearch();
  const trimmed = query.trim();
  const queryFn = trimmed ? api.tasks.search : api.tasks.listCompleted;
  const queryArgs = trimmed ? { query: trimmed } : undefined;
  const tasks = useQuery(queryFn, queryArgs);

  return (
    <TaskList
      title="Completed"
      subtitle="Restore tasks or review what you finished."
      tasks={tasks}
    />
  );
}
