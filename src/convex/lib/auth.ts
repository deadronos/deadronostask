import type { Id } from "../_generated/dataModel";

export async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated");
  }
  return identity.subject as Id<"users">;
}

export function assertOwned<T extends { ownerId: Id<"users"> }>(
  doc: T | null,
  ownerId: Id<"users">
): asserts doc is T {
  if (!doc || doc.ownerId !== ownerId) {
    throw new Error("Not found");
  }
}
