'use client';

import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, Check, Plus, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { SubtaskList } from '@/components/subtask-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils/cn';

interface TaskDetailModalProperties {
  readonly task: Doc<'tasks'> & { labelIds?: Id<'labels'>[] };
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProperties) {
  const updateTask = useMutation(api.tasks.update);
  const deleteTask = useMutation(api.tasks.archive);
  const createLabel = useMutation(api.labels.create);

  const labels = useQuery(api.labels.list, {});

  const [desc, setDesc] = useState(task.description ?? '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  // Create Label State
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('bg-slate-500'); // Default

  const PREDEFINED_COLORS = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
    'bg-slate-500',
  ];

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;

    const labelId = await createLabel({
      name: newLabelName.trim(),
      color: newLabelColor,
    });

    // Auto-assign the new label
    toggleLabel(labelId);

    // Reset state
    setNewLabelName('');
    setNewLabelColor('bg-slate-500');
    setIsCreatingLabel(false);
  };

  const handleDescSave = () => {
    updateTask({ taskId: task._id, description: desc });
    setIsEditingDesc(false);
  };

  const toggleLabel = (labelId: Id<'labels'>) => {
    const currentLabels = task.labelIds || [];
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter(id => id !== labelId)
      : [...currentLabels, labelId];

    updateTask({ taskId: task._id, labelIds: newLabels });
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl gap-8">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl font-semibold leading-none tracking-tight">
              {task.title}
            </DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-2">
            <Badge variant="outline">{task.status}</Badge>
            <Badge variant={task.priority === 3 ? 'destructive' : 'secondary'}>
              Priority: {['Low', 'Medium', 'High', 'Urgent'][task.priority]}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
          <div className="space-y-8">
            {/* Description Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
              {isEditingDesc ? (
                <div className="space-y-2">
                  <Textarea
                    value={desc}
                    onChange={event => setDesc(event.target.value)}
                    placeholder="Add more details..."
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleDescSave}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingDesc(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="prose-sm min-h-[60px] cursor-pointer rounded-md border border-transparent p-2 hover:border-border/60 hover:bg-muted/30"
                  onClick={() => setIsEditingDesc(true)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') setIsEditingDesc(true);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {task.description ?? (
                    <span className="text-muted-foreground italic">Add a description...</span>
                  )}
                </div>
              )}
            </div>

            {/* Subtasks Section */}
            <SubtaskList taskId={task._id} />
          </div>

          <div className="space-y-6">
            {/* Sidebar Actions */}

            {/* Labels Picker */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Labels</span>
              <div className="flex flex-wrap gap-2">
                {task.labelIds?.map(labelId => {
                  const label = labels?.find(l => l._id === labelId);
                  // eslint-disable-next-line unicorn/no-null -- React requires null for conditional rendering
                  if (!label) return null;
                  return (
                    <Badge
                      key={labelId}
                      className={cn(
                        'bg-opacity-20 text-foreground border-transparent',
                        label.color,
                      )}
                    >
                      {label.name}
                    </Badge>
                  );
                })}

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-full justify-start gap-2">
                      <Tag className="h-3 w-3" /> Add Label
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[220px] p-0" align="start">
                    {isCreatingLabel ? (
                      <div className="p-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setIsCreatingLabel(false)}
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium">New Label</span>
                        </div>
                        <Input
                          placeholder="Label name"
                          className="h-8 text-xs"
                          value={newLabelName}
                          onChange={event => setNewLabelName(event.target.value)}
                          onKeyDown={event => {
                            if (event.key === 'Enter') handleCreateLabel();
                          }}
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {PREDEFINED_COLORS.map(color => (
                            <button
                              key={color}
                              className={cn(
                                'h-5 w-5 rounded-full transition-all hover:scale-110 focus:outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-1',
                                color,
                                newLabelColor === color && 'ring-2 ring-ring ring-offset-1',
                              )}
                              onClick={() => setNewLabelColor(color)}
                            />
                          ))}
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={handleCreateLabel}
                          disabled={!newLabelName.trim()}
                        >
                          Create
                        </Button>
                      </div>
                    ) : (
                      <Command>
                        <CommandInput placeholder="Search labels..." />
                        <CommandList>
                          <CommandEmpty className="p-2">
                            <div className="text-sm text-muted-foreground text-center mb-2">
                              No labels found.
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full h-8"
                              onClick={() => setIsCreatingLabel(true)}
                            >
                              <Plus className="mr-2 h-3 w-3" /> Create &quot;{newLabelName || 'New'}
                              &quot;
                            </Button>
                          </CommandEmpty>
                          <CommandGroup>
                            {labels?.map(label => (
                              <CommandItem
                                key={label._id}
                                onSelect={() => toggleLabel(label._id)}
                                className="gap-2"
                              >
                                <div className={cn('h-4 w-4 rounded-full', label.color)} />
                                {label.name}
                                {task.labelIds?.includes(label._id) === true && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <div className="p-1 border-t mt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-8 justify-start text-muted-foreground"
                              onClick={() => setIsCreatingLabel(true)}
                            >
                              <Plus className="mr-2 h-3 w-3" /> Create new label
                            </Button>
                          </div>
                        </CommandList>
                      </Command>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="border-t pt-4">
              <Button
                variant="destructive"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  deleteTask({ taskId: task._id });
                  onClose();
                }}
              >
                <Trash2 className="h-4 w-4" /> Delete Task
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
