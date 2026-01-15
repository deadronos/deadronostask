"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const defaultViews = [
  { value: "today", label: "Today" },
  { value: "inbox", label: "Inbox" },
  { value: "projects", label: "Projects" }
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [defaultView, setDefaultView] = React.useState("today");

  React.useEffect(() => {
    const stored = window.localStorage.getItem("defaultView");
    if (stored) setDefaultView(stored);
  }, []);

  const handleDefaultView = (value: string) => {
    setDefaultView(value);
    window.localStorage.setItem("defaultView", value);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-white/70 p-6 shadow-sm dark:bg-slate-950/60">
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Customize your workspace vibe and defaults.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white/70 p-6 shadow-sm dark:bg-slate-950/60">
          <h3 className="text-lg font-semibold">Theme</h3>
          <p className="text-sm text-muted-foreground">
            Switch between light and dark.
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              variant={theme === "light" ? "primary" : "outline"}
              onClick={() => setTheme("light")}
            >
              Light
            </Button>
            <Button
              variant={theme === "dark" ? "primary" : "outline"}
              onClick={() => setTheme("dark")}
            >
              Dark
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white/70 p-6 shadow-sm dark:bg-slate-950/60">
          <h3 className="text-lg font-semibold">Default view</h3>
          <p className="text-sm text-muted-foreground">
            Choose where you land after signing in.
          </p>
          <div className="mt-4">
            <select
              className="h-10 w-full rounded-md border border-border bg-white/80 px-3 text-sm dark:bg-slate-950/50"
              value={defaultView}
              onChange={(event) => handleDefaultView(event.target.value)}
            >
              {defaultViews.map((view) => (
                <option key={view.value} value={view.value}>
                  {view.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
