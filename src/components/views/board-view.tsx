'use client';

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
import { CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { SortableTaskItem } from '@/components/sortable-task-item';
import { TaskItem } from '@/components/task-item';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Id, type Doc } from '@/convex/_generated/dataModel';

type Task = Doc<'tasks'> & { labelIds?: Id<'labels'>[] };
type TaskStatus = 'todo' | 'doing' | 'done';
const STATUS_VALUES = new Set<TaskStatus>(['todo', 'doing', 'done']);

function DroppableColumn({ id, children }: Readonly<{ id: string; children: React.ReactNode }>) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="flex h-full min-h-[150px] flex-col gap-3">
      {children}
    </div>
  );
}

function getTargetStatus(
  overId: string | number,
  overTask: { status: TaskStatus } | undefined,
): TaskStatus | undefined {
  if (STATUS_VALUES.has(overId as TaskStatus)) {
    return overId as TaskStatus;
  }
  return overTask?.status;
}

function calculateNewOrder(
  previousItem: { order: number } | undefined,
  nextItem: { order: number } | undefined,
): number {
  if (previousItem && nextItem) {
    return (previousItem.order + nextItem.order) / 2;
  }
  if (previousItem) {
    return previousItem.order + 1;
  }
  if (nextItem && nextItem.order !== Infinity) {
    return nextItem.order - 1;
  }
  return Date.now();
}

function getMaxOrder(tasks: { order: number }[]): number {
  if (tasks.length === 0) return 0;
  return Math.max(...tasks.map(t => t.order));
}

interface TaskBoardViewProperties {
  readonly tasks: Task[];
  readonly onTaskReorder: (arguments_: {
    taskId: Id<'tasks'>;
    order: number;
    status?: TaskStatus;
  }) => void;
}

export function TaskBoardView({ tasks, onTaskReorder }: TaskBoardViewProperties) {
  const [activeId, setActiveId] = useState<Id<'tasks'>>();
  const [localTasks, setLocalTasks] = useState(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
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

  const todoTasks = localTasks.filter(t => t.status === 'todo');
  const doingTasks = localTasks.filter(t => t.status === 'doing');
  const doneTasks = localTasks.filter(t => t.status === 'done');

  const activeTask = activeId ? localTasks.find(t => t._id === activeId) : undefined;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as Id<'tasks'>);
  }

  function handleSameColumnDrag(activeId: Id<'tasks'>, overId: Id<'tasks'>) {
    if (activeId === overId) return;

    const newItems = [...localTasks];
    const activeIndex = newItems.findIndex(t => t._id === activeId);
    const overIndex = newItems.findIndex(t => t._id === overId);

    if (activeIndex !== -1 && overIndex !== -1) {
      const reordered = arrayMove(newItems, activeIndex, overIndex);
      setLocalTasks(reordered);
    }
  }

  function handleDifferentColumnDrag(
    activeId: Id<'tasks'>,
    overId: Id<'tasks'>,
    overStatus: TaskStatus,
  ) {
    const newItems = [...localTasks];
    const activeIndex = newItems.findIndex(t => t._id === activeId);
    const overIndex = newItems.findIndex(t => t._id === overId);

    if (activeIndex !== -1) {
      newItems[activeIndex] = {
        ...newItems[activeIndex],
        status: overStatus,
      };

      if (overIndex === -1) {
        setLocalTasks(newItems);
      } else {
        const reordered = arrayMove(newItems, activeIndex, overIndex);
        setLocalTasks(reordered);
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as Id<'tasks'>;
    const overId = over.id as Id<'tasks'>;

    // Find the containers
    const activeTask = localTasks.find(t => t._id === activeId);
    const overTask = localTasks.find(t => t._id === overId);

    if (!activeTask) return;

    const activeStatus = activeTask.status;
    // If over an item, use its status, otherwise check if over a container
    let overStatus = overTask ? overTask.status : undefined;

    // If overId matches a status container ID
    if (STATUS_VALUES.has(overId as unknown as TaskStatus)) {
      overStatus = overId as unknown as TaskStatus;
    }

    if (overStatus) {
      if (activeStatus === overStatus) {
        handleSameColumnDrag(activeId, overId);
      } else {
        handleDifferentColumnDrag(activeId, overId, overStatus);
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(undefined);

    if (!over) return;

    const activeTaskId = active.id as Id<'tasks'>;
    const overId = over.id;

    const activeTask = localTasks.find(t => t._id === activeTaskId);
    if (!activeTask) return;

    const overTask = localTasks.find(t => t._id === overId);
    const newStatus = getTargetStatus(overId as string, overTask) ?? activeTask.status;

    const hasPositionChanged = activeTaskId !== overId || activeTask.status !== newStatus;
    if (!hasPositionChanged) return;

    const reorderResult = tryReorderWithinColumn(activeTaskId, newStatus);
    if (reorderResult) return;

    // Fallback: status changed but position calculation failed (e.g. dropping into empty column)
    if (activeTask.status !== newStatus) {
      const targetColumnTasks = localTasks.filter(t => t.status === newStatus);
      const maxOrder = getMaxOrder(targetColumnTasks);
      onTaskReorder({ taskId: activeTaskId, order: maxOrder + 1, status: newStatus });
    }
  }

  function tryReorderWithinColumn(taskId: Id<'tasks'>, status: TaskStatus): boolean {
    const columnTasks = localTasks.filter(t => t.status === status);
    const taskIndex = columnTasks.findIndex(t => t._id === taskId);

    if (taskIndex === -1) return false;

    const previousItem = columnTasks[taskIndex - 1];
    const nextItem = columnTasks[taskIndex + 1];
    const newOrder = calculateNewOrder(previousItem, nextItem);

    onTaskReorder({ taskId, order: newOrder, status });
    return true;
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
          <ListTodo className="h-16 w-16 text-muted-foreground/50" />
          <div>
            <h3 className="text-lg font-semibold">No tasks yet</h3>
            <p className="text-sm text-muted-foreground">Create your first task to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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

      {typeof document !== 'undefined' &&
        createPortal(
          <DragOverlay>
            {activeTask ? (
              <div className="rotate-2 cursor-grabbing opacity-90">
                <TaskItem task={activeTask} />
              </div>
            ) : undefined}
          </DragOverlay>,
          document.body,
        )}
    </DndContext>
  );
}
