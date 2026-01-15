import * as React from 'react';

import { cn } from '@/lib/utils';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'outline';
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const styles =
    variant === 'outline'
      ? 'border border-border text-foreground'
      : 'bg-muted text-muted-foreground';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        styles,
        className,
      )}
      {...props}
    />
  );
}
