const eagerModules = import.meta.glob('/src/convex/**/*.*s', { eager: true });

export const convexModules = Object.fromEntries(
  Object.entries(eagerModules).map(([path, module]) => [path, async () => module]),
) as Record<string, () => Promise<unknown>>;
