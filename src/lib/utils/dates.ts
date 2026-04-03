import { format } from 'date-fns';

export function formatTaskDate(date: Date | string | number | null | undefined): string {
  if (date === null || date === undefined || date === '') return '';
  return format(new Date(date), 'MMM d');
}
