'use client';

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { TaskDetailModal } from '@/components/task-detail-modal';
import { Button } from '@/components/ui/button';
import { type Doc, type Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils/cn';

type Task = Doc<'tasks'> & { labelIds?: Id<'labels'>[] };

interface TaskCalendarViewProperties {
  readonly tasks: Task[];
}

export function TaskCalendarView({ tasks }: TaskCalendarViewProperties) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function nextMonth() {
    setCurrentDate(addMonths(currentDate, 1));
  }

  function previousMonth() {
    setCurrentDate(subMonths(currentDate, 1));
  }

  function getTasksForDay(day: Date) {
    return tasks.filter(task => {
      if (task.dueAt === null || task.dueAt === undefined) return false;
      return isSameDay(new Date(task.dueAt), day);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-border">
        {weekDays.map(day => (
          <div
            key={day}
            className="bg-card p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
        {days.map(day => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);

          return (
            <div
              key={day.toString()}
              className={cn(
                'min-h-[100px] bg-card p-2 transition-colors hover:bg-card/80',
                !isCurrentMonth && 'bg-card/40 text-muted-foreground',
              )}
            >
              <div
                className={cn(
                  'mb-1 text-right text-sm',
                  isSameDay(day, new Date()) && 'font-bold text-primary',
                )}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayTasks.map(task => (
                  <button
                    key={task._id}
                    onClick={() => setSelectedTask(task)}
                    className={cn(
                      'block w-full truncate rounded px-1.5 py-0.5 text-left text-xs',
                      task.status === 'done'
                        ? 'bg-muted text-muted-foreground line-through'
                        : 'bg-primary/10 text-primary hover:bg-primary/20',
                    )}
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask !== undefined && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(undefined)}
        />
      )}
    </div>
  );
}
