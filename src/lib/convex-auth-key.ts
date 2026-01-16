export function normalizePkcs8Key(raw: string): string {
  let value = raw.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  if (value.includes('\\n') && !value.includes('\n')) {
    value = value.replace(/\\n/g, '\n');
  }

  return value.trim();
}
