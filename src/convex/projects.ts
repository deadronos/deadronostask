import { v } from 'convex/values';

import { type Id } from './_generated/dataModel';
import {
  type UserMutationContext,
  type UserQueryContext,
  mutationWithUser,
  queryWithUser,
} from './lib/auth';
import { archiveWithCheck } from './lib/utilities';
import { checkOwnership, validateString } from './lib/validations';

/**
 * List all projects for the current user
 */
export const list = queryWithUser({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (context: UserQueryContext, arguments_: { includeArchived?: boolean }) => {
    const { clerkUserId } = context;
    const includeArchived = arguments_.includeArchived ?? false;

    return await (includeArchived
      ? context.db
          .query('projects')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type
          .withIndex('by_owner', (q: any) => q.eq('ownerClerkUserId', clerkUserId))
          .order('desc')
          .collect()
      : context.db
          .query('projects')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type
          .withIndex('by_owner_archived', (q: any) =>
            q.eq('ownerClerkUserId', clerkUserId).eq('archived', false),
          )
          .order('desc')
          .collect());
  },
});

/**
 * Create a new project
 */
export const create = mutationWithUser({
  args: {
    name: v.string(),
  },
  handler: async (context: UserMutationContext, arguments_: { name: string }) => {
    const { clerkUserId } = context;

    const name = validateString(arguments_.name, 'Project name', 100);

    const now = Date.now();

    return await context.db.insert('projects', {
      ownerClerkUserId: clerkUserId,
      name,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a project
 */
export const update = mutationWithUser({
  args: {
    projectId: v.id('projects'),
    name: v.optional(v.string()),
  },
  handler: async (
    context: UserMutationContext,
    arguments_: { projectId: Id<'projects'>; name?: string },
  ) => {
    const { clerkUserId } = context;

    await checkOwnership(context, arguments_.projectId, clerkUserId, 'Project not found');

    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (arguments_.name !== undefined) {
      patch.name = validateString(arguments_.name, 'Project name', 100);
    }

    await context.db.patch(arguments_.projectId, patch);
  },
});

/**
 * Archive a project
 */
export const archive = mutationWithUser({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (context: UserMutationContext, arguments_: { projectId: Id<'projects'> }) => {
    const { clerkUserId } = context;

    await archiveWithCheck(context, arguments_.projectId, clerkUserId, 'Project not found');
  },
});
