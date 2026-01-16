'use client';

import { useSearch } from '@/components/search-context';
import { TaskList } from '@/components/TaskList';
import { api } from '@/convex/_generated/api';
import { useQuery } from '@/lib/convex-client';

export default function TodayPage() {
  const { query } = useSearch();
  const trimmed = query.trim();
  // Call both hooks unconditionally; skip the search when there's no query
  const searchResults = useQuery(api.tasks.search, trimmed ? { query: trimmed } : 'skip');
  const today = useQuery(api.tasks.listToday);
  const tasks = trimmed ? searchResults : today;

  return <TaskList title="Today" subtitle="Due today and overdue tasks." tasks={tasks} />;
}
