import { UserButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { ListTodo, LayoutDashboard, FolderOpen, Settings } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { TRPCProvider } from '@/lib/trpc/client';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <TRPCProvider>
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <ListTodo className="h-5 w-5" />
                </span>
                <span className="hidden font-display text-lg font-semibold tracking-tight sm:inline-block">
                  TaskFlow
                </span>
              </Link>
              <nav className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/70 px-2 py-1 text-sm font-medium md:flex">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-foreground/70 transition hover:bg-muted/80 hover:text-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/projects"
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-foreground/70 transition hover:bg-muted/80 hover:text-foreground"
                >
                  <FolderOpen className="h-4 w-4" />
                  Projects
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/settings">
                <Button variant="ghost" size="icon" aria-label="Open settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </TRPCProvider>
  );
}
