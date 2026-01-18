'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { ArrowLeft, Calendar, Check, GanttChartSquare, Layout, ListTodo, Tag } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { CreateTaskButton } from '@/components/create-task-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TaskBoardView } from '@/components/views/board-view';
import { TaskCalendarView } from '@/components/views/calendar-view';
import { TaskListView } from '@/components/views/list-view';
import { TaskTimelineView } from '@/components/views/timeline-view';
import { api } from '@/convex/_generated/api';
import { type Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils/cn';

/** Extracted component for label filter items to reduce nested function depth */
function LabelCommandItem({
  label,
  isSelected,
  onToggle,
}: Readonly<{
  label: { _id: Id<'labels'>; name: string; color: string };
  isSelected: boolean;
  onToggle: (labelId: Id<'labels'>) => void;
}>) {
  return (
    <CommandItem onSelect={() => onToggle(label._id)}>
      <div
        className={cn(
          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
          isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
        )}
      >
        <Check className="h-4 w-4" />
      </div>
      <div className={cn('h-3 w-3 rounded-full mr-2', label.color)} />
      <span>{label.name}</span>
    </CommandItem>
  );
}

export default function ProjectPage() {
  const { user, isLoaded } = useUser();
  const parameters = useParams();
  const projectId = parameters.projectId as Id<'projects'>;

  const [view, setView] = useState<'board' | 'list' | 'calendar' | 'timeline'>('list');

  // Filtering state
  const [selectedLabels, setSelectedLabels] = useState<Id<'labels'>[]>([]);

  const reorderTask = useMutation(api.tasks.reorder).withOptimisticUpdate(
    (localStore, arguments_) => {
      const { taskId, order, status } = arguments_;
      const existingTasks = localStore.getQuery(api.tasks.list, {
        projectId,
        includeArchived: false,
      });

      if (existingTasks) {
        const newTasks = existingTasks.map(t => {
          if (t._id === taskId) {
            return { ...t, order, ...(status && { status }) };
          }
          return t;
        });

        const sorted = newTasks.toSorted((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          return b.createdAt - a.createdAt;
        });

        localStore.setQuery(api.tasks.list, { projectId, includeArchived: false }, sorted);
      }
    },
  );

  // Guard Convex queries - only run when user is authenticated
  const project = useQuery(
    api.projects.list,
    !isLoaded || !user ? 'skip' : { includeArchived: false },
  );
  const currentProject = project?.find(p => p._id === projectId);
  const tasks = useQuery(
    api.tasks.list,
    !isLoaded || !user ? 'skip' : { projectId, includeArchived: false },
  );

  const labels = useQuery(api.labels.list, {});

  if (!isLoaded || !user || tasks === undefined || project === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Project not found</div>
      </div>
    );
  }

  // Filter tasks locally based on selectedLabels
  const filteredTasks = tasks.filter(t => {
    if (selectedLabels.length === 0) return true;
    if (!t.labelIds) return false;
    return selectedLabels.some(labelId => t.labelIds?.includes(labelId) === true);
  });

  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  function handleLabelToggle(labelId: Id<'labels'>) {
    setSelectedLabels(previous =>
      previous.includes(labelId) ? previous.filter(id => id !== labelId) : [...previous, labelId],
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(30,42,94,0.18),_transparent_55%),radial-gradient(circle_at_20%_20%,_rgba(244,220,194,0.5),_transparent_45%)]">
      <div
        className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-accent/60 blur-3xl"
        aria-hidden="true"
      />
      <div className="container relative mx-auto space-y-6 px-4 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_30px_60px_-45px_rgba(15,23,42,0.45)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mb-2 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="font-display text-4xl font-semibold tracking-tight">
              {currentProject.name}
            </h1>
            <p className="text-muted-foreground">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} • {doneTasks.length} completed
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* View Switcher */}
            <div className="flex items-center gap-1 rounded-lg border bg-background/50 p-1">
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView('list')}
                title="List View"
              >
                <ListTodo className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'board' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView('board')}
                title="Board View"
              >
                <Layout className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'calendar' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView('calendar')}
                title="Calendar View"
              >
                <Calendar className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'timeline' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView('timeline')}
                title="Timeline View"
              >
                <GanttChartSquare className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-dashed">
                    <Tag className="mr-2 h-4 w-4" />
                    Labels
                    {selectedLabels.length > 0 && (
                      <>
                        <div className="mx-2 h-4 w-[1px] bg-border" />
                        <Badge
                          variant="secondary"
                          className="rounded-sm px-1 font-normal lg:hidden"
                        >
                          {selectedLabels.length}
                        </Badge>
                        <div className="hidden space-x-1 lg:flex">
                          {selectedLabels.length > 2 ? (
                            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                              {selectedLabels.length} selected
                            </Badge>
                          ) : (
                            labels
                              ?.filter(l => selectedLabels.includes(l._id))
                              .map(label => (
                                <Badge
                                  key={label._id}
                                  variant="secondary"
                                  className="rounded-sm px-1 font-normal"
                                >
                                  {label.name}
                                </Badge>
                              ))
                          )}
                        </div>
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Filter label..." />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup>
                        {labels?.map(label => (
                          <LabelCommandItem
                            key={label._id}
                            label={label}
                            isSelected={selectedLabels.includes(label._id)}
                            onToggle={handleLabelToggle}
                          />
                        ))}
                      </CommandGroup>
                      {selectedLabels.length > 0 && (
                        <>
                          <CommandSeparator />
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => setSelectedLabels([])}
                              className="justify-center text-center"
                            >
                              Clear filters
                            </CommandItem>
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <CreateTaskButton projectId={projectId} />
            </div>
          </div>
        </div>

        {/* Views */}
        <div className="min-h-[500px]">
          {view === 'board' && <TaskBoardView tasks={filteredTasks} onTaskReorder={reorderTask} />}
          {view === 'list' && <TaskListView tasks={filteredTasks} />}
          {view === 'calendar' && <TaskCalendarView tasks={filteredTasks} />}
          {view === 'timeline' && <TaskTimelineView tasks={filteredTasks} />}
        </div>
      </div>
    </div>
  );
}
