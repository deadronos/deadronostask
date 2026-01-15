'use client';

import { useQuery } from 'convex/react';

import { useSearch } from '@/components/search-context';
import { TaskList } from '@/components/TaskList';
import { api } from '@/convex/_generated/api';

export default function TodayPage() {
  const { query } = useSearch();
  const trimmed = query.trim();
  const tasks = useQuery(
    trimmed ? api.tasks.search : api.tasks.listToday,
    trimmed ? { query: trimmed } : {},
  );

  return <TaskList title="Today" subtitle="Due today and overdue tasks." tasks={tasks} />;
}
