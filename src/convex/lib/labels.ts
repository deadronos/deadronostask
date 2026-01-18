import { type Doc as Document_, type Id } from '../_generated/dataModel';
import { type QueryCtx as QueryContext } from '../_generated/server';

// Helper to validate that labels belong to the user
export async function validateLabels(
  context: QueryContext,
  labelIds: Id<'labels'>[],
  clerkUserId: string,
) {
  const uniqueLabelIds = [...new Set(labelIds)];
  const labels = await Promise.all(uniqueLabelIds.map((id: Id<'labels'>) => context.db.get(id)));
  for (const label of labels) {
    if (!label) throw new Error('Label not found');
    if (label.ownerClerkUserId !== clerkUserId) throw new Error('Unauthorized label');
  }
  return uniqueLabelIds;
}
