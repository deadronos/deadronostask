'use client';

import { LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

import { SearchBox } from './SearchBox';
import { Button } from './ui/button';

export function Topbar() {
  const { data: session } = useSession();

  return (
    <div className="flex w-full items-center gap-3">
      <SearchBox />
      <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
        <span>{session?.user?.name ?? session?.user?.email ?? 'Signed in'}</span>
      </div>
      <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/' })}>
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Sign out</span>
      </Button>
    </div>
  );
}
