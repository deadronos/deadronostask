import { type Id, type Doc } from '../_generated/dataModel';
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

// Tables that definitely have 'archived' and 'updatedAt' fields
type ArchivableTable = 'tasks' | 'projects';

/**
 * Archives a document after verifying ownership.
 * Restricted to tables that have 'archived' and 'updatedAt' fields.
 */
export async function archiveWithCheck<T extends ArchivableTable>(
  ctx: MutationCtx,
  id: Id<T>,
  clerkUserId: string,
  notFoundMessage = 'Document not found',
) {
  await checkOwnership(ctx, id, clerkUserId, notFoundMessage);

  await ctx.db.patch(id, {
    archived: true,
    updatedAt: Date.now(),
  } as unknown as Partial<Doc<T>>);
}
