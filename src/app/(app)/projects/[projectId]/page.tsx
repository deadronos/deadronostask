'use client';

import { useUser } from '@clerk/nextjs';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import { useQuery, useMutation } from 'convex/react';
import { ArrowLeft, CheckCircle2, Clock, ListTodo, Tag, Check } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { CreateTaskButton } from '@/components/CreateTaskButton';
import { SortableTaskItem } from '@/components/SortableTaskItem';
import { TaskItem } from '@/components/TaskItem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { api } from '@/convex/_generated/api';
import { type Id, type Doc } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils/cn';

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="flex h-full min-h-[150px] flex-col gap-3">
      {children}
    </div>
  );
}

export default function ProjectPage() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const projectId = params.projectId as Id<'projects'>;

  // Local state for tasks to support optimistic UI updates during drag
  const [orderedTasks, setOrderedTasks] = useState<(Doc<'tasks'> & { labelIds?: Id<'labels'>[] })[]>(
    [],
  );
  const [activeId, setActiveId] = useState<Id<'tasks'> | null>(null);

  // Filtering state
  const [selectedLabels, setSelectedLabels] = useState<Id<'labels'>[]>([]);

  const reorderTask = useMutation(api.tasks.reorder).withOptimisticUpdate((localStore, args) => {
    const { taskId, order, status } = args;
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

      newTasks.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return b.createdAt - a.createdAt;
      });

      localStore.setQuery(api.tasks.list, { projectId, includeArchived: false }, newTasks);
    }
  });

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

  // Sync tasks from Convex to local state when they change
  useEffect(() => {
    if (tasks) {
      setOrderedTasks(tasks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
  const filteredTasks = orderedTasks.filter(t => {
    if (selectedLabels.length === 0) return true;
    if (!t.labelIds) return false;
    return selectedLabels.some(labelId => t.labelIds?.includes(labelId));
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const doingTasks = filteredTasks.filter(t => t.status === 'doing');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  const activeTask = activeId ? orderedTasks.find(t => t._id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as Id<'tasks'>);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the containers
    const activeTask = orderedTasks.find(t => t._id === activeId);
    const overTask = orderedTasks.find(t => t._id === overId);

    if (!activeTask) return;

    const activeStatus = activeTask.status;
    // If over an item, use its status, otherwise check if over a container
    let overStatus = overTask ? overTask.status : null;

    // If overId matches a status container ID (we'll use status strings as container IDs)
    if (['todo', 'doing', 'done'].includes(overId as string)) {
      overStatus = overId as 'todo' | 'doing' | 'done';
    }

    if (!overStatus) return;

    // If moving between columns
    if (activeStatus !== overStatus) {
      setOrderedTasks(items => {
        const activeIndex = items.findIndex(t => t._id === activeId);
        const overIndex = items.findIndex(t => t._id === overId);

        if (activeIndex === -1) return items;

        // Clone the items
        const newItems = [...items];

        // Update the status of the active item
        newItems[activeIndex] = {
          ...newItems[activeIndex],
          status: overStatus as 'todo' | 'doing' | 'done',
        };

        // If dropping on a container (empty or not), just update status
        if (overIndex === -1) {
          return newItems;
        }

        return arrayMove(newItems, activeIndex, overIndex);
      });
    } else {
      // Reordering within the same column
      if (activeId !== overId) {
        setOrderedTasks(items => {
          const activeIndex = items.findIndex(t => t._id === activeId);
          const overIndex = items.findIndex(t => t._id === overId);

          if (activeIndex === -1 || overIndex === -1) return items;

          return arrayMove(items, activeIndex, overIndex);
        });
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = orderedTasks.find(t => t._id === activeId);

    if (!activeTask) return;

    let newStatus = activeTask.status;
    const overTask = orderedTasks.find(t => t._id === overId);

    // Check if we dropped on a column container
    if (['todo', 'doing', 'done'].includes(overId as string)) {
      newStatus = overId as 'todo' | 'doing' | 'done';
    } else if (overTask) {
      newStatus = overTask.status;
    }

    if (activeId !== overId || activeTask.status !== newStatus) {
      // Ensure activeTask is in the right status in our local state check
      const finalColumnTasks = orderedTasks.filter(t => t.status === newStatus);
      const finalIndex = finalColumnTasks.findIndex(t => t._id === activeId);

      if (finalIndex !== -1) {
        const prevItem = finalColumnTasks[finalIndex - 1];
        const nextItem = finalColumnTasks[finalIndex + 1];

        const prevOrder = prevItem ? prevItem.order : -Infinity;
        const nextOrder = nextItem ? nextItem.order : Infinity;

        let newOrder = 0;
        if (prevItem && nextItem) {
          newOrder = (prevOrder + nextOrder) / 2;
        } else if (prevItem) {
          newOrder = prevOrder + 1;
        } else if (nextItem) {
          newOrder = nextOrder === Infinity ? Date.now() : nextOrder - 1;
        } else {
          newOrder = Date.now();
        }

        reorderTask({ taskId: activeId as Id<'tasks'>, order: newOrder, status: newStatus });
        return;
      }
    }

    // Fallback if status changed but calculation failed (e.g. empty list logic)
    if (activeTask.status !== newStatus) {
      const targetColumnTasks = tasks?.filter(t => t.status === newStatus) || [];
      const maxOrder = targetColumnTasks.reduce((max, t) => Math.max(max, t.order), 0);
      reorderTask({ taskId: activeId as Id<'tasks'>, order: maxOrder + 1, status: newStatus });
    }
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
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed">
                  <Tag className="mr-2 h-4 w-4" />
                  Labels
                  {selectedLabels.length > 0 && (
                    <>
                      <div className="mx-2 h-4 w-[1px] bg-border" />
                      <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
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
                      {labels?.map(label => {
                        const isSelected = selectedLabels.includes(label._id);
                        return (
                          <CommandItem
                            key={label._id}
                            onSelect={() => {
                              if (isSelected) {
                                setSelectedLabels(prev => prev.filter(id => id !== label._id));
                              } else {
                                setSelectedLabels(prev => [...prev, label._id]);
                              }
                            }}
                          >
                            <div
                              className={cn(
                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'opacity-50 [&_svg]:invisible',
                              )}
                            >
                              <Check className="h-4 w-4" />
                            </div>
                            <div className={cn('h-3 w-3 rounded-full mr-2', label.color)} />
                            <span>{label.name}</span>
                          </CommandItem>
                        );
                      })}
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

        {/* Task Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
                <ListTodo className="h-16 w-16 text-muted-foreground/50" />
                <div>
                  <h3 className="text-lg font-semibold">No tasks yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Create your first task to get started
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* To Do Column */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ListTodo className="h-5 w-5 text-muted-foreground" />
                    To Do
                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                      {todoTasks.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full min-h-[150px]">
                  <DroppableColumn id="todo">
                    <SortableContext
                      id="todo"
                      items={todoTasks.map(t => t._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {todoTasks.map(task => (
                        <SortableTaskItem key={task._id} task={task} />
                      ))}
                      {todoTasks.length === 0 && (
                        <div className="flex h-full flex-grow items-center justify-center text-sm text-muted-foreground/40">
                          Drop items here
                        </div>
                      )}
                    </SortableContext>
                  </DroppableColumn>
                </CardContent>
              </Card>

              {/* In Progress Column */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    In Progress
                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                      {doingTasks.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full min-h-[150px]">
                  <DroppableColumn id="doing">
                    <SortableContext
                      id="doing"
                      items={doingTasks.map(t => t._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {doingTasks.map(task => (
                        <SortableTaskItem key={task._id} task={task} />
                      ))}
                      {doingTasks.length === 0 && (
                        <div className="flex h-full flex-grow items-center justify-center text-sm text-muted-foreground/40">
                          Drop items here
                        </div>
                      )}
                    </SortableContext>
                  </DroppableColumn>
                </CardContent>
              </Card>

              {/* Done Column */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    Done
                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                      {doneTasks.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full min-h-[150px]">
                  <DroppableColumn id="done">
                    <SortableContext
                      id="done"
                      items={doneTasks.map(t => t._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {doneTasks.map(task => (
                        <SortableTaskItem key={task._id} task={task} />
                      ))}
                      {doneTasks.length === 0 && (
                        <div className="flex h-full flex-grow items-center justify-center text-sm text-muted-foreground/40">
                          Drop items here
                        </div>
                      )}
                    </SortableContext>
                  </DroppableColumn>
                </CardContent>
              </Card>
            </div>
          )}

          {typeof document !== 'undefined' &&
            createPortal(
              <DragOverlay>
                {activeTask ? (
                  <div className="rotate-2 cursor-grabbing opacity-90">
                    <TaskItem task={activeTask} />
                  </div>
                ) : null}
              </DragOverlay>,
              document.body,
            )}
        </DndContext>
      </div>
    </div>
  );
}
