import { MutationCtx, QueryCtx } from '../_generated/server';
import { Id, TableNames } from '../_generated/dataModel';

/**
 * Checks if a document exists and belongs to the current user.
 * Assumes the document has an 'ownerClerkUserId' field.
 */
export async function checkOwnership<T extends TableNames>(
  ctx: QueryCtx | MutationCtx,
  id: Id<T>,
  clerkUserId: string,
  notFoundMessage = 'Document not found'
) {
  const doc = await ctx.db.get(id);
  if (!doc) {
    throw new Error(notFoundMessage);
  }

  // Check if the document has an owner field and if it matches
  if (!('ownerClerkUserId' in doc) || (doc as any).ownerClerkUserId !== clerkUserId) {
    throw new Error('Unauthorized');
  }

  return doc;
}

/**
 * Validates a string input.
 * Checks if it is non-empty (after trim) and within max length.
 */
export function validateString(
  value: string,
  fieldName: string,
  maxLength: number
) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} is required`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or less`);
  }
  return trimmed;
}
