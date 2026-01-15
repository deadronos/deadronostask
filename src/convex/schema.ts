import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerified: v.optional(v.number()),
    image: v.optional(v.string())
  }).index("email", ["email"]),
  accounts: defineTable({
    userId: v.id("users"),
    type: v.string(),
    provider: v.string(),
    providerAccountId: v.string(),
    refresh_token: v.optional(v.string()),
    access_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    token_type: v.optional(v.string()),
    scope: v.optional(v.string()),
    id_token: v.optional(v.string()),
    session_state: v.optional(v.string()),
    refresh_token_expires_in: v.optional(v.number())
  })
    .index("providerAndAccountId", ["provider", "providerAccountId"])
    .index("userId", ["userId"]),
  sessions: defineTable({
    sessionToken: v.string(),
    userId: v.id("users"),
    expires: v.number()
  })
    .index("sessionToken", ["sessionToken"])
    .index("userId", ["userId"]),
  verificationTokens: defineTable({
    identifier: v.string(),
    token: v.string(),
    expires: v.number()
  }).index("identifierToken", ["identifier", "token"]),
  authenticators: defineTable({
    credentialID: v.string(),
    credentialPublicKey: v.string(),
    counter: v.number(),
    userId: v.id("users"),
    transports: v.optional(v.array(v.string())),
    credentialDeviceType: v.string(),
    credentialBackedUp: v.boolean()
  })
    .index("userId", ["userId"])
    .index("credentialID", ["credentialID"]),
  projects: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    color: v.string(),
    icon: v.string(),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_owner_order", ["ownerId", "order"])
    .index("by_owner_name", ["ownerId", "name"]),
  labels: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    color: v.string(),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_owner_name", ["ownerId", "name"]),
  tasks: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    isCompleted: v.boolean(),
    priority: v.union(v.literal("low"), v.literal("med"), v.literal("high")),
    dueDate: v.union(v.null(), v.number()),
    projectId: v.union(v.null(), v.id("projects")),
    labelIds: v.array(v.id("labels")),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_owner_updatedAt", ["ownerId", "updatedAt"])
    .index("by_owner_project_order", ["ownerId", "projectId", "order"])
    .index("by_owner_dueDate", ["ownerId", "dueDate"])
    .index("by_owner_completed", ["ownerId", "isCompleted"])
});

export default schema;
