'use client';

import { useMutation, useQuery } from 'convex/react';
import { CheckCircle2, Circle, Clock, AlertCircle, Archive } from 'lucide-react';
import { useState } from 'react';

import { TaskDetailModal } from './task-detail-modal';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import { type Doc, type Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils/cn';

interface TaskItemProperties {
  readonly task: Doc<'tasks'> & { labelIds?: Id<'labels'>[] };
}

export function TaskItem({ task }: TaskItemProperties) {
  const setStatus = useMutation(api.tasks.setStatus);
  const archiveTask = useMutation(api.tasks.archive);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Labels - simplified, we might want to pass this down or use Query preloading
  // But for now, we'll fetch labels for the project to display correct colors
  const labels = useQuery(api.labels.list, {});
  const subtasks = useQuery(api.subtasks.list, { taskId: task._id });

  const priorityConfig = {
    0: { label: 'Low', variant: 'secondary' as const, icon: Circle },
    1: { label: 'Medium', variant: 'default' as const, icon: Clock },
    2: { label: 'High', variant: 'default' as const, icon: AlertCircle },
    3: { label: 'Urgent', variant: 'destructive' as const, icon: AlertCircle },
  };

  const statusConfig = {
    todo: { label: 'To Do', icon: Circle, color: 'text-muted-foreground' },
    doing: { label: 'In Progress', icon: Clock, color: 'text-primary' },
    done: { label: 'Done', icon: CheckCircle2, color: 'text-emerald-600' },
  };

  const completedSubtasks = subtasks?.filter(s => s.completed).length ?? 0;
  const totalSubtasks = subtasks?.length ?? 0;

  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') setIsModalOpen(true);
        }}
        role="button"
        tabIndex={0}
        className={cn(
          'group rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm transition-all hover:border-primary/40 hover:bg-card hover:shadow-md cursor-pointer',
          task.status === 'done' && 'opacity-60',
        )}
      >
        <div className="flex items-start gap-3">
          <StatusIcon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', status.color)} />
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4
                className={cn('font-medium leading-snug', task.status === 'done' && 'line-through')}
              >
                {task.title}
              </h4>
              <Badge variant={priority.variant} className="flex-shrink-0">
                {priority.label}
              </Badge>
            </div>

            {/* Labels - row of pills */}
            {task.labelIds && task.labelIds.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.labelIds.map(labelId => {
                  const label = labels?.find(l => l._id === labelId);
                  // eslint-disable-next-line unicorn/no-null -- React requires null for conditional rendering
                  if (!label) return null;
                  return (
                    <div
                      key={labelId}
                      className={cn('h-1.5 w-6 rounded-full', label.color)}
                      title={label.name}
                    />
                  );
                })}
              </div>
            )}

            {task.description !== undefined && task.description !== '' && (
              <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
            )}

            {/* Subtasks progress */}
            {totalSubtasks > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-1.5 w-full max-w-[60px] rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                  />
                </div>
                <span>
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </div>
            )}

            <div
              className="flex items-center gap-2 pt-1"
              onClick={event => event.stopPropagation()}
              onKeyDown={event => event.stopPropagation()}
              role="toolbar"
              aria-label="Task actions"
            >
              <Select
                value={task.status}
                onChange={event =>
                  setStatus({
                    taskId: task._id,
                    status: event.target.value as 'todo' | 'doing' | 'done',
                  })
                }
                className="h-8 text-xs"
              >
                <option value="todo">To Do</option>
                <option value="doing">In Progress</option>
                <option value="done">Done</option>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => archiveTask({ taskId: task._id })}
                className="ml-auto h-8 text-xs opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Archive className="mr-1 h-3 w-3" />
                Archive
              </Button>
            </div>
          </div>
        </div>
      </div>

      <TaskDetailModal task={task} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
