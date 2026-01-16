'use client';

import { UserButton } from '@clerk/nextjs';

export default function SettingsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(30,42,94,0.18),_transparent_55%),radial-gradient(circle_at_20%_20%,_rgba(244,220,194,0.5),_transparent_45%)]">
      <div
        className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-accent/60 blur-3xl"
        aria-hidden="true"
      />
      <div className="container relative mx-auto space-y-8 px-4 py-10">
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Preferences
          </span>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Keep your account details, authentication, and preferences aligned.
          </p>
        </header>

        <div className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_30px_60px_-45px_rgba(15,23,42,0.45)] backdrop-blur">
          <h2 className="mb-4 text-2xl font-semibold">Account</h2>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <UserButton afterSignOutUrl="/sign-in" />
            <p className="text-muted-foreground">
              Manage your profile, authentication, and notification preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
