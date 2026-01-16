'use client';

import { useMutation } from 'convex/react';
import { CheckCircle2, Circle, Clock, AlertCircle, Archive } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils/cn';

interface TaskItemProps {
  task: {
    _id: Id<'tasks'>;
    title: string;
    description?: string;
    status: 'todo' | 'doing' | 'done';
    priority: 0 | 1 | 2 | 3;
    dueAt?: number;
  };
}

export function TaskItem({ task }: TaskItemProps) {
  const setStatus = useMutation(api.tasks.setStatus);
  const archiveTask = useMutation(api.tasks.archive);

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

  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        'group rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm transition-all hover:border-primary/40 hover:bg-card hover:shadow-md',
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

          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}

          <div className="flex items-center gap-2 pt-1">
            <Select
              value={task.status}
              onChange={e =>
                setStatus({
                  taskId: task._id,
                  status: e.target.value as 'todo' | 'doing' | 'done',
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
  );
}
