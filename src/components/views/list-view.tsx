'use client';

import { useMutation, useQuery } from 'convex/react';
import { Archive } from 'lucide-react';
import { useState } from 'react';

import { TaskDetailModal } from '@/components/task-detail-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { type Doc, type Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils/cn';
import { formatTaskDate } from '@/lib/utils/dates';
import { getNextStatus, statusConfig, priorityLabels } from '@/lib/utils/tasks';

type Task = Doc<'tasks'> & { labelIds?: Id<'labels'>[] };

interface TaskListViewProperties {
  readonly tasks: Task[];
}

export function TaskListView({ tasks }: TaskListViewProperties) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <p>No tasks found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map(task => (
        <TaskListItem key={task._id} task={task} />
      ))}
    </div>
  );
}

function TaskListItem({ task }: { readonly task: Task }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const setStatus = useMutation(api.tasks.setStatus);
  const archiveTask = useMutation(api.tasks.archive);

  // We fetch labels to show colors
  const labels = useQuery(api.labels.list, {});

  const StatusIcon = statusConfig[task.status].icon;
  const statusColor = statusConfig[task.status].color;

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-4 rounded-lg border border-border/40 bg-card/60 p-3 transition-colors hover:bg-card',
          task.status === 'done' && 'opacity-60',
        )}
        onClick={() => setIsModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(event: React.KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') setIsModalOpen(true);
        }}
      >
        <button
          type="button"
          onClick={(event: React.MouseEvent) => {
            event.stopPropagation();
            const nextStatus = getNextStatus(task.status);
            setStatus({ taskId: task._id, status: nextStatus });
          }}
          className={cn('flex-shrink-0 transition-transform hover:scale-110', statusColor)}
        >
          <StatusIcon className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-center md:gap-4">
          <span
            className={cn(
              'truncate font-medium flex-1',
              task.status === 'done' && 'line-through text-muted-foreground',
            )}
          >
            {task.title}
          </span>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {task.labelIds && task.labelIds.length > 0 && (
              <div className="flex gap-1">
                {task.labelIds.map(labelId => {
                  const label = labels?.find(l => l._id === labelId);
                  if (label === undefined) {
                    // eslint-disable-next-line unicorn/no-null
                    return null;
                  }
                  return (
                    <div
                      key={labelId}
                      className={cn('h-2 w-2 rounded-full', label.color)}
                      title={label.name}
                    />
                  );
                })}
              </div>
            )}

            {task.dueAt !== null && task.dueAt !== undefined && (
              <span>{formatTaskDate(task.dueAt)}</span>
            )}

            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
              {priorityLabels[task.priority]}
            </Badge>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={(event: React.MouseEvent) => {
            event.stopPropagation();
            archiveTask({ taskId: task._id });
          }}
          className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100"
        >
          <Archive className="h-4 w-4" />
        </Button>
      </div>

      <TaskDetailModal task={task} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
