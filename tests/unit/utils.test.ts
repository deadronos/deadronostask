import { describe, expect, it } from 'vitest';

import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges tailwind classes and resolves conflicts', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('ignores falsy values and joins valid classes', () => {
    expect(cn('px-2', false && 'hidden', undefined, 'py-1')).toBe('px-2 py-1');
  });
});
