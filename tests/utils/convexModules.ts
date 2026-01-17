// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eagerModules = (import.meta as any).glob('/src/convex/**/*.*s', { eager: true });

export const convexModules = Object.fromEntries(
  Object.entries(eagerModules).map(([path, module]) => [path, async () => module]),
) as Record<string, () => Promise<unknown>>;
