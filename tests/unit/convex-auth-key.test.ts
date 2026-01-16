import { describe, expect, it } from 'vitest';

import { normalizePkcs8Key } from '@/lib/convex-auth-key';

describe('normalizePkcs8Key', () => {
  it('removes wrapping quotes', () => {
    expect(normalizePkcs8Key('"abc"')).toBe('abc');
    expect(normalizePkcs8Key("'abc'")).toBe('abc');
  });

  it('converts escaped newlines', () => {
    const raw = '"-----BEGIN PRIVATE KEY-----\\nline1\\nline2\\n-----END PRIVATE KEY-----\\n"';
    const normalized = normalizePkcs8Key(raw);

    expect(normalized).toContain('-----BEGIN PRIVATE KEY-----');
    expect(normalized).toContain('\nline1\nline2\n');
    expect(normalized).toContain('-----END PRIVATE KEY-----');
  });

  it('leaves multiline strings intact', () => {
    const raw = '-----BEGIN PRIVATE KEY-----\nline1\nline2\n-----END PRIVATE KEY-----\n';
    const normalized = normalizePkcs8Key(raw);

    expect(normalized).toBe(raw.trim());
  });
});
