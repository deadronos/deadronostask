import { Search } from 'lucide-react';
console.log('import-lucide: imported Search');

import { describe, it, expect } from 'vitest';

describe('import-lucide', () => {
  it('imports lucide', () => {
    expect(typeof Search).toBe('function');
  });
});