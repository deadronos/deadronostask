'use client';

import { differenceInDays, addDays, format, startOfDay } from 'date-fns';
import { Link } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';

import { TaskDetailModal } from '@/components/task-detail-modal';
import { type Doc, type Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils/cn';

type Task = Doc<'tasks'> & { labelIds?: Id<'labels'>[] };

interface TaskTimelineViewProperties {
  readonly tasks: Task[];
}

export function TaskTimelineView({ tasks }: TaskTimelineViewProperties) {
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const containerReference = useRef<HTMLDivElement>(null);

  // Determine timeline range
  const { startDate, totalDays } = useMemo(() => {
    if (tasks.length === 0) {
      const now = new Date();
      return { startDate: addDays(now, -7), endDate: addDays(now, 7), totalDays: 14 };
    }

    let minDate = new Date();
    let maxDate = new Date();

    for (const task of tasks) {
      const start = new Date(task.createdAt);
      const end =
        task.dueAt !== null && task.dueAt !== undefined ? new Date(task.dueAt) : addDays(start, 1);

      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    }

    // Add some padding
    minDate = addDays(minDate, -3);
    maxDate = addDays(maxDate, 7);

    // Normalize to start of day
    minDate = startOfDay(minDate);
    maxDate = startOfDay(maxDate);

    const days = differenceInDays(maxDate, minDate);

    return { startDate: minDate, endDate: maxDate, totalDays: days > 0 ? days : 14 };
  }, [tasks]);

  const pxPerDay = 50;
  const headerHeight = 40;
  const rowHeight = 40;

  // Generate days for header
  const days = useMemo(() => {
    return Array.from({ length: totalDays }).map((_, index) => addDays(startDate, index));
  }, [startDate, totalDays]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-background shadow-sm">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Task List */}
        <div className="flex w-64 flex-col border-r bg-card/50">
          <div
            style={{ height: headerHeight }}
            className="flex items-center border-b px-4 font-semibold text-sm text-muted-foreground"
          >
            Task
          </div>
          <div className="flex-1 overflow-hidden overflow-y-auto scrollbar-hide">
            {tasks.map(task => (
              <div
                key={task._id}
                style={{ height: rowHeight }}
                className="flex items-center border-b px-4 text-sm font-medium truncate hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedTask(task)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    setSelectedTask(task);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="truncate">{task.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content - Timeline */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div
            ref={containerReference}
            className="flex overflow-x-auto scrollbar-hide"
            style={{ height: headerHeight }}
          >
            <div className="flex" style={{ width: totalDays * pxPerDay }}>
              {days.map((day, index) => (
                <div
                  key={index}
                  style={{ width: pxPerDay }}
                  className="flex flex-col items-center justify-center border-b border-r text-xs text-muted-foreground"
                >
                  <span className="font-semibold">{format(day, 'd')}</span>
                  <span className="text-[10px]">{format(day, 'MMM')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid & Bars */}
          <div
            className="relative flex-1 overflow-auto"
            onScroll={event => {
              if (containerReference.current) {
                containerReference.current.scrollLeft = event.currentTarget.scrollLeft;
              }
            }}
          >
            <div style={{ width: totalDays * pxPerDay, height: tasks.length * rowHeight }}>
              {/* Vertical Grid Lines */}
              {days.map((_, index) => (
                <div
                  key={index}
                  className="absolute bottom-0 top-0 border-r border-dashed border-border/40"
                  style={{ left: (index + 1) * pxPerDay }}
                />
              ))}

              {/* Task Rows */}
              {tasks.map((task, index) => {
                const taskStart = new Date(task.createdAt);
                const taskEnd =
                  task.dueAt !== null && task.dueAt !== undefined
                    ? new Date(task.dueAt)
                    : addDays(taskStart, 1);

                // Calculate position
                const dayDiff = differenceInDays(startOfDay(taskStart), startDate);
                const duration = differenceInDays(startOfDay(taskEnd), startOfDay(taskStart));
                const displayDuration = Math.max(duration, 1); // Minimum 1 day width

                const left = dayDiff * pxPerDay;
                const width = displayDuration * pxPerDay;

                // Status Color
                let bgColor = 'bg-primary';
                if (task.status === 'done') bgColor = 'bg-emerald-500';
                if (task.status === 'todo') bgColor = 'bg-slate-400';

                // Dependencies
                const dependencies = task.dependencies
                  ?.map(depId => tasks.find(t => t._id === depId))
                  .filter((t): t is Task => t !== undefined);

                return (
                  <div
                    key={task._id}
                    style={{ height: rowHeight, top: index * rowHeight }}
                    className="absolute left-0 right-0 flex items-center border-b hover:bg-muted/10"
                  >
                    <div
                      className={cn(
                        'absolute h-6 rounded-md opacity-90 hover:opacity-100 cursor-pointer shadow-sm text-[10px] text-primary-foreground flex items-center px-2 truncate',
                        bgColor,
                      )}
                      style={{ left, width: Math.max(width - 4, 10) }} // -4 for margin
                      onClick={() => setSelectedTask(task)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          setSelectedTask(task);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      title={`${task.title} (${format(taskStart, 'MMM d')} - ${
                        task.dueAt !== null && task.dueAt !== undefined
                          ? format(new Date(task.dueAt), 'MMM d')
                          : '?'
                      })${
                        dependencies && dependencies.length > 0
                          ? `\nDepends on: ${dependencies.map(d => d.title).join(', ')}`
                          : ''
                      }`}
                    >
                      {task.title}
                      {dependencies && dependencies.length > 0 && (
                        <Link className="ml-auto h-3 w-3 opacity-70 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedTask !== undefined && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={true}
          onClose={() => setSelectedTask(undefined)}
        />
      )}
    </div>
  );
}
