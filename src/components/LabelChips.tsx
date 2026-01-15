"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const colors = ["#0EA5E9", "#F97316", "#10B981", "#E11D48", "#6366F1"];

const labelColorClasses: Record<string, string> = {
  "#0EA5E9": "bg-sky-500",
  "#F97316": "bg-orange-500",
  "#10B981": "bg-emerald-500",
  "#E11D48": "bg-rose-600",
  "#6366F1": "bg-indigo-500"
};

type Props = {
  selectedIds?: Id<"labels">[];
  onChange?: (value: Id<"labels">[]) => void;
  compact?: boolean;
  allowCreate?: boolean;
};

export function LabelChips({
  selectedIds,
  onChange,
  compact = false,
  allowCreate = false
}: Props) {
  const labels = useQuery(api.labels.list) ?? [];
  const createLabel = useMutation(api.labels.create);
  const renameLabel = useMutation(api.labels.rename);
  const removeLabel = useMutation(api.labels.remove);

  const handleToggle = (id: Id<"labels">) => {
    if (!selectedIds || !onChange) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((value) => value !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleCreate = async () => {
    const name = window.prompt("Label name?");
    if (!name) return;
    const color = colors[Math.floor(Math.random() * colors.length)];
    try {
      await createLabel({ name, color });
    } catch (error) {
      console.error(error);
      toast.error("Could not create label");
    }
  };

  const handleRename = async (id: Id<"labels">, current: string) => {
    const name = window.prompt("Rename label", current);
    if (!name || name === current) return;
    try {
      await renameLabel({ id, name });
    } catch (error) {
      console.error(error);
      toast.error("Could not rename label");
    }
  };

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}> 
      <div className="flex items-center justify-between">
        <h3 className={cn("text-sm font-semibold", compact && "text-xs")}>Labels</h3>
        {allowCreate && (
          <Button size="sm" variant="ghost" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add label</span>
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {labels.length === 0 && (
          <p className="text-xs text-muted-foreground">No labels yet.</p>
        )}
        {labels.map((label) => {
          const selected = selectedIds?.includes(label._id);
          return (
            <div
              key={label._id}
              className={cn(
                "group flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs",
                selected && "border-primary text-primary"
              )}
            >
              <button
                type="button"
                className="flex items-center gap-2"
                onClick={() => handleToggle(label._id)}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    labelColorClasses[label.color] ?? "bg-muted"
                  )}
                />
                {label.name}
              </button>
              {allowCreate && (
                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleRename(label._id, label.name)}
                    aria-label={`Rename label ${label.name}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete label?")) {
                        removeLabel({ id: label._id }).catch((error) => {
                          console.error(error);
                          toast.error("Could not delete label");
                        });
                      }
                    }}
                    aria-label={`Delete label ${label.name}`}
                  >
                    <Trash2 className="h-3 w-3 text-danger" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
