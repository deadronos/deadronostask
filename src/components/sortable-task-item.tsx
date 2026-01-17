'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { TaskItem } from './task-item';

import type { Doc } from '@/convex/_generated/dataModel';

interface SortableTaskItemProperties {
  readonly task: Doc<'tasks'>;
}

export function SortableTaskItem({ task }: Readonly<SortableTaskItemProperties>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskItem task={task} />
    </div>
  );
}
