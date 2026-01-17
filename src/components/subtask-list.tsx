'use client';

import { useMutation, useQuery } from 'convex/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils/cn';

interface SubtaskListProperties {
  readonly taskId: Id<'tasks'>;
}

export function SubtaskList({ taskId }: SubtaskListProperties) {
  const subtasks = useQuery(api.subtasks.list, { taskId });
  const createSubtask = useMutation(api.subtasks.create);
  const toggleSubtask = useMutation(api.subtasks.toggle);
  const deleteSubtask = useMutation(api.subtasks.remove);

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    await createSubtask({ taskId, title: newSubtaskTitle.trim() });
    setNewSubtaskTitle('');
  };

  if (subtasks === undefined) {
    return <div className="text-sm text-muted-foreground">Loading subtasks...</div>;
  }

  const completedCount = subtasks.filter(s => s.completed).length;
  const progress = subtasks.length === 0 ? 0 : Math.round((completedCount / subtasks.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Subtasks</h3>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{subtasks.length}
        </span>
      </div>

      {subtasks.length > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="space-y-2">
        {subtasks.map(subtask => (
          <div
            key={subtask._id}
            className="group flex items-center justify-between gap-3 rounded-lg border border-transparent p-2 transition hover:bg-muted/50"
          >
            <div className="flex flex-1 items-center gap-3">
              <Checkbox
                checked={subtask.completed}
                onCheckedChange={checked =>
                  toggleSubtask({ subtaskId: subtask._id, completed: checked === true })
                }
              />
              <span
                className={cn(
                  'text-sm transition-colors',
                  subtask.completed ? 'text-muted-foreground line-through' : 'text-foreground',
                )}
              >
                {subtask.title}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => deleteSubtask({ subtaskId: subtask._id })}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="flex items-center gap-2">
        <Input
          placeholder="Add a step..."
          value={newSubtaskTitle}
          onChange={event => setNewSubtaskTitle(event.target.value)}
          className="h-8 text-sm"
        />
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          className="h-8"
          disabled={!newSubtaskTitle.trim()}
        >
          <Plus className="mr-1 h-3 w-3" /> Add
        </Button>
      </form>
    </div>
  );
}
