"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { cn } from "@/lib/utils";

export function TaskItem({
  task,
  labelById,
  onEdit,
  onMoveUp,
  onMoveDown
}: {
  task: Doc<"tasks">;
  labelById: Map<Id<"labels">, Doc<"labels">>;
  onEdit: (task: Doc<"tasks">) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const toggle = useMutation(api.tasks.toggleComplete);
  const remove = useMutation(api.tasks.remove);

  const dueLabel = formatDueDate(task.dueDate);
  const overdue = task.dueDate !== null && task.dueDate < Date.now();

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-border bg-white/80 p-4 shadow-xs transition hover:shadow-md dark:bg-slate-950/60">
      <Checkbox
        checked={task.isCompleted}
        onCheckedChange={() => toggle({ id: task._id })}
        aria-label={task.isCompleted ? "Mark incomplete" : "Mark complete"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={cn(
              "text-sm font-semibold",
              task.isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </h3>
          {task.priority !== "med" && (
            <Badge variant="outline">{task.priority.toUpperCase()}</Badge>
          )}
          {dueLabel && (
            <Badge className={cn(overdue && "bg-danger text-white")}>{dueLabel}</Badge>
          )}
        </div>
        {task.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {task.description}
          </p>
        )}
        {task.labelIds.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {task.labelIds.map((labelId) => {
              const label = labelById.get(labelId);
              if (!label) return null;
              return (
                <span
                  key={labelId}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 opacity-0 transition group-hover:opacity-100">
        <Button size="sm" variant="ghost" onClick={() => onEdit(task)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => remove({ id: task._id })}>
          <Trash2 className="h-4 w-4 text-danger" />
        </Button>
        {onMoveUp && (
          <Button size="sm" variant="ghost" onClick={onMoveUp}>
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
        {onMoveDown && (
          <Button size="sm" variant="ghost" onClick={onMoveDown}>
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function formatDueDate(value: number | null) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
