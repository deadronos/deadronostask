import { type Id, type TableNames } from '../_generated/dataModel';
import { type MutationCtx } from '../_generated/server';

import { checkOwnership } from './validations';

/**
 * Calculates the next order value based on existing items.
 * @param items List of items with an 'order' property
 * @param defaultStart The starting order value if list is empty (default 1)
 */
export function getNextOrder(items: { order: number }[], defaultStart = 1): number {
  if (!items || items.length === 0) {
    return defaultStart;
  }
  return Math.max(...items.map(i => i.order)) + 1;
}

/**
 * Archives a document after verifying ownership.
 * Requires the table to have an 'archived' boolean field and 'updatedAt' number field.
 */
export async function archiveWithCheck<T extends TableNames>(
  ctx: MutationCtx,
  id: Id<T>,
  clerkUserId: string,
  notFoundMessage = 'Document not found',
) {
  await checkOwnership(ctx, id, clerkUserId, notFoundMessage);

  // We cast to any here because we can't easily prove T has 'archived' and 'updatedAt'
  // without defining a stricter type for T, but we know tasks and projects have them.
  await ctx.db.patch(id, {
    archived: true,
    updatedAt: Date.now(),
  } as any);
}
