'use client';

import { useQuery } from 'convex/react';

import { useSearch } from '@/components/search-context';
import { TaskList } from '@/components/TaskList';
import { api } from '@/convex/_generated/api';

export default function InboxPage() {
  const { query } = useSearch();
  const trimmed = query.trim();
  const queryFn = trimmed ? api.tasks.search : api.tasks.listInbox;
  const queryArgs = trimmed ? { query: trimmed } : undefined;
  const tasks = useQuery(queryFn, queryArgs);

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
