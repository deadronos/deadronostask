"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        className:
          "border border-border bg-white/90 text-foreground shadow-lg dark:bg-slate-950/90"
      }}
    />
  );
}
