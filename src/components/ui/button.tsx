import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({
  className,
  asChild = false,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  const base =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-60';
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-muted text-foreground hover:bg-muted/70',
    ghost: 'hover:bg-muted/60',
    outline: 'border border-border hover:bg-muted/60',
    danger: 'bg-danger text-white hover:bg-danger/90',
  };
  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-6 text-base',
  };

  return <Comp className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
