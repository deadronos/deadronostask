import { type Id, type TableNames } from '../_generated/dataModel';
import {
  type MutationCtx as MutationContext,
  type QueryCtx as QueryContext,
} from '../_generated/server';

/**
 * Checks if a document exists and belongs to the current user.
 * Assumes the document has an 'ownerClerkUserId' field.
 */
export async function checkOwnership<T extends TableNames>(
  context: QueryContext | MutationContext,
  id: Id<T>,
  clerkUserId: string,
  notFoundMessage = 'Document not found',
) {
  const document = await context.db.get(id);
  if (!document) {
    throw new Error(notFoundMessage);
  }

  // Check if the document has an owner field and if it matches
  if (
    !('ownerClerkUserId' in document) ||
    (document as unknown as { ownerClerkUserId: string }).ownerClerkUserId !== clerkUserId
  ) {
    throw new Error('Unauthorized');
  }

  return document;
}

/**
 * Validates a string input.
 * Checks if it is non-empty (after trim) and within max length.
 */
export function validateString(value: string, fieldName: string, maxLength: number) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} is required`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or less`);
  }
  return trimmed;
}
