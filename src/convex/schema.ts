import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_clerk_user_id', ['clerkUserId']),

  projects: defineTable({
    ownerClerkUserId: v.string(),
    name: v.string(),
    archived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_owner', ['ownerClerkUserId'])
    .index('by_owner_archived', ['ownerClerkUserId', 'archived']),

  tasks: defineTable({
    ownerClerkUserId: v.string(),
    projectId: v.optional(v.union(v.id('projects'), v.null())),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal('todo'), v.literal('doing'), v.literal('done')),
    priority: v.union(v.literal(0), v.literal(1), v.literal(2), v.literal(3)),
    dueAt: v.optional(v.union(v.number(), v.null())),
    labelIds: v.optional(v.array(v.id('labels'))),
    order: v.number(),
    archived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_owner', ['ownerClerkUserId'])
    .index('by_owner_project', ['ownerClerkUserId', 'projectId'])
    .index('by_owner_status', ['ownerClerkUserId', 'status'])
    .index('by_owner_due', ['ownerClerkUserId', 'dueAt'])
    .index('by_owner_archived', ['ownerClerkUserId', 'archived']),

  labels: defineTable({
    projectId: v.id('projects'),
    name: v.string(),
    color: v.string(), // hex or tailwind class
  }).index('by_project', ['projectId']),

  subtasks: defineTable({
    taskId: v.id('tasks'),
    title: v.string(),
    completed: v.boolean(),
    order: v.number(),
  }).index('by_task', ['taskId']),
});
