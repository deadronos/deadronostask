import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

export type TaskStatus = 'todo' | 'doing' | 'done';

export const STATUS_VALUES = new Set<TaskStatus>(['todo', 'doing', 'done']);

export function getNextStatus(status: TaskStatus): TaskStatus {
  if (status === 'todo') return 'doing';
  if (status === 'doing') return 'done';
  return 'todo';
}

export const statusConfig = {
  todo: { label: 'To Do', icon: Circle, color: 'text-muted-foreground' },
  doing: { label: 'In Progress', icon: Clock, color: 'text-primary' },
  done: { label: 'Done', icon: CheckCircle2, color: 'text-emerald-600' },
} as const;

export const priorityConfig = {
  0: { label: 'Low', variant: 'secondary' as const, icon: Circle },
  1: { label: 'Medium', variant: 'default' as const, icon: Clock },
  2: { label: 'High', variant: 'default' as const, icon: AlertCircle },
  3: { label: 'Urgent', variant: 'destructive' as const, icon: AlertCircle },
} as const;

export const priorityLabels = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
  3: 'Urgent',
} as const;
