export type TaskStatus = 'todo' | 'doing' | 'done';

export const STATUS_VALUES = new Set<TaskStatus>(['todo', 'doing', 'done']);

export function getNextStatus(status: TaskStatus): TaskStatus {
  if (status === 'todo') return 'doing';
  if (status === 'doing') return 'done';
  return 'todo';
}
