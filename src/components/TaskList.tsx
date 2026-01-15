'use client';

import { useMutation, useQuery } from 'convex/react';
import { Plus, Sparkles } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { LabelChips } from './LabelChips';
import { TaskEditorDialog } from './TaskEditorDialog';
import { TaskItem } from './TaskItem';
import { Button } from './ui/button';

import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';

export function TaskList({
  title,
  subtitle,
  tasks,
  projectId,
  allowReorder = false,
}: {
  title: string;
  subtitle: string;
  tasks: Doc<'tasks'>[] | undefined;
  projectId?: Id<'projects'> | null;
  allowReorder?: boolean;
}) {
  const labels = useQuery(api.labels.list) ?? [];
  const reorder = useMutation(api.tasks.reorderInProject);
  const [selectedLabels, setSelectedLabels] = React.useState<Id<'labels'>[]>([]);
  const [priorityFilter, setPriorityFilter] = React.useState<'all' | 'low' | 'med' | 'high'>('all');
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Doc<'tasks'> | null>(null);

  const labelById = React.useMemo(() => {
    const map = new Map<Id<'labels'>, Doc<'labels'>>();
    labels.forEach(label => map.set(label._id, label));
    return map;
  }, [labels]);

  const filtered = React.useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(task => {
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (selectedLabels.length > 0) {
        return selectedLabels.every(id => task.labelIds.includes(id));
      }
      return true;
    });
  }, [tasks, priorityFilter, selectedLabels]);

  const handleEdit = (task: Doc<'tasks'>) => {
    setEditingTask(task);
    setEditorOpen(true);
  };

  const handleReorder = async (from: number, to: number) => {
    if (!allowReorder || !tasks) return;
    if (to < 0 || to >= tasks.length) return;
    const ordered = [...tasks];
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    try {
      await reorder({
        projectId: projectId ?? null,
        orderedIds: ordered.map(task => task._id),
      });
    } catch (error) {
      console.error(error);
      toast.error('Could not reorder tasks');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white/70 p-6 shadow-xs dark:bg-slate-950/60 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setEditingTask(null);
              setEditorOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New task
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <LabelChips selectedIds={selectedLabels} onChange={setSelectedLabels} />
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground" htmlFor="tasklist-priority">
            Priority
          </label>
          <select
            id="tasklist-priority"
            className="h-9 rounded-md border border-border bg-white/80 px-3 text-sm dark:bg-slate-950/50"
            value={priorityFilter}
            onChange={event =>
              setPriorityFilter(event.target.value as 'all' | 'low' | 'med' | 'high')
            }
          >
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {!tasks && (
        <div className="grid gap-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-xl border border-border bg-white/60 dark:bg-slate-950/60"
            />
          ))}
        </div>
      )}

      {tasks && filtered.length === 0 && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border p-10 text-center">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
          <h3 className="mt-3 text-lg font-semibold">All clear</h3>
          <p className="text-sm text-muted-foreground">
            Nothing to show here. Create a task to get moving.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((task, index) => (
          <TaskItem
            key={task._id}
            task={task}
            labelById={labelById}
            onEdit={handleEdit}
            onMoveUp={allowReorder ? () => handleReorder(index, index - 1) : undefined}
            onMoveDown={allowReorder ? () => handleReorder(index, index + 1) : undefined}
          />
        ))}
      </div>

      <TaskEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initialTask={editingTask}
        defaultProjectId={projectId}
      />
    </div>
  );
}
