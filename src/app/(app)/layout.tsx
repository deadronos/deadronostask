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
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 flex">
              <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
                <ListTodo className="h-6 w-6" />
                <span className="hidden font-bold sm:inline-block">TaskFlow</span>
              </Link>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 transition-colors hover:text-foreground/80"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/projects"
                  className="flex items-center gap-2 transition-colors hover:text-foreground/80"
                >
                  <FolderOpen className="h-4 w-4" />
                  Projects
                </Link>
              </nav>
            </div>
            <div className="ml-auto flex items-center space-x-4">
              <Link href="/settings">
                <Button variant="ghost" size="icon">
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
