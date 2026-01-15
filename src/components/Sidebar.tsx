'use client';

import { CalendarDays, CheckCircle2, Inbox, Settings, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { LabelChips } from './LabelChips';
import { ProjectList } from './ProjectList';

import { cn } from '@/lib/utils';

const navItems = [
  { href: '/app/today', label: 'Today', icon: CalendarDays },
  { href: '/app/inbox', label: 'Inbox', icon: Inbox },
  { href: '/app/projects', label: 'Projects', icon: Sparkles },
  { href: '/app/completed', label: 'Completed', icon: CheckCircle2 },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          ✓
        </div>
        <div>
          <div className="text-lg font-semibold">Taskflow</div>
          <p className="text-xs text-muted-foreground">Convex powered</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                active
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <ProjectList />

      <div className="mt-auto">
        <LabelChips compact allowCreate />
      </div>
    </div>
  );
}
