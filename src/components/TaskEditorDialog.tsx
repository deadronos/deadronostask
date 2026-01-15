"use client";

import * as React from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";

const priorities = [
  { value: "low", label: "Low" },
  { value: "med", label: "Medium" },
  { value: "high", label: "High" }
] as const;

const labelColorClasses: Record<string, string> = {
  "#0EA5E9": "bg-sky-500",
  "#F97316": "bg-orange-500",
  "#10B981": "bg-emerald-500",
  "#E11D48": "bg-rose-600",
  "#6366F1": "bg-indigo-500"
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTask?: Doc<"tasks"> | null;
  defaultProjectId?: Id<"projects"> | null;
};

export function TaskEditorDialog({
  open,
  onOpenChange,
  initialTask,
  defaultProjectId
}: Props) {
  const projects = useQuery(api.projects.list) ?? [];
  const labels = useQuery(api.labels.list) ?? [];
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState("med");
  const [dueDate, setDueDate] = React.useState<string>("");
  const [projectId, setProjectId] = React.useState<Id<"projects"> | null>(
    null
  );
  const [labelIds, setLabelIds] = React.useState<Id<"labels">[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTitle(initialTask?.title ?? "");
    setDescription(initialTask?.description ?? "");
    setPriority(initialTask?.priority ?? "med");
    setDueDate(initialTask?.dueDate ? toDateInput(initialTask.dueDate) : "");
    setProjectId(initialTask?.projectId ?? defaultProjectId ?? null);
    setLabelIds(initialTask?.labelIds ?? []);
  }, [open, initialTask, defaultProjectId]);

  const handleSubmit = async () => {
    if (isSaving) return;
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const due = dueDate ? new Date(dueDate).getTime() : null;
    try {
      setIsSaving(true);
      if (initialTask) {
        await updateTask({
          id: initialTask._id,
          patch: {
            title,
            description,
            priority: priority as "low" | "med" | "high",
            dueDate: due,
            projectId,
            labelIds
          }
        });
      } else {
        await createTask({
          title,
          description,
          priority: priority as "low" | "med" | "high",
          dueDate: due,
          projectId,
          labelIds
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Could not save task");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{initialTask ? "Edit task" : "New task"}</DialogTitle>
            <DialogDescription>
              Capture the details and keep your day moving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="task-priority">
                  Priority
                </label>
                <select
                  id="task-priority"
                  className="h-10 w-full rounded-md border border-border bg-white/80 px-3 text-sm dark:bg-slate-950/50"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                >
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Due date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="task-project">
                  Project
                </label>
                <select
                  id="task-project"
                  className="h-10 w-full rounded-md border border-border bg-white/80 px-3 text-sm dark:bg-slate-950/50"
                  value={projectId ?? ""}
                  onChange={(event) =>
                    setProjectId((event.target.value as Id<"projects">) || null)
                  }
                >
                  <option value="">Inbox</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Labels</label>
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => {
                    const selected = labelIds.includes(label._id);
                    return (
                      <button
                        key={label._id}
                        type="button"
                        onClick={() =>
                          setLabelIds((prev) =>
                            prev.includes(label._id)
                              ? prev.filter((id) => id !== label._id)
                              : [...prev, label._id]
                          )
                        }
                        className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                          selected ? "border-primary text-primary" : "border-border"
                        }`}
                      >
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            labelColorClasses[label.color] ?? "bg-muted"
                          )}
                        />
                        {label.name}
                      </button>
                    );
                  })}
                  {labels.length === 0 && (
                    <p className="text-xs text-muted-foreground">Create labels in the sidebar.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : initialTask ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toDateInput(value: number) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
