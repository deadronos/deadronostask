import { v } from 'convex/values';
import { customMutation, customQuery } from 'convex-helpers/server/customFunctions';

import type { Doc } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

const secretArg = { secret: v.string() };

function assertSecret(secret: string) {
  const expected = process.env.CONVEX_AUTH_ADAPTER_SECRET;
  if (!expected || secret !== expected) {
    throw new Error('Unauthorized');
  }
}

const adapterQuery = customQuery(query, {
  args: secretArg,
  input: async (ctx, args) => {
    assertSecret(args.secret);
    return { ctx, args: {} };
  },
});

const adapterMutation = customMutation(mutation, {
  args: secretArg,
  input: async (ctx, args) => {
    assertSecret(args.secret);
    return { ctx, args: {} };
  },
});

type UserDoc = Doc<'users'>;

function mapUser(doc: UserDoc | null) {
  if (!doc) return null;
  return {
    id: doc._id,
    name: doc.name ?? null,
    email: doc.email ?? null,
    emailVerified: doc.emailVerified ?? null,
    image: doc.image ?? null,
  };
}

export const createUser = adapterMutation({
  args: {
    secret: v.string(),
    data: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerified: v.optional(v.union(v.null(), v.number())),
      image: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('users', {
      name: args.data.name,
      email: args.data.email,
      emailVerified: args.data.emailVerified ?? null,
      image: args.data.image,
    });
    const user = await ctx.db.get(id);
    return mapUser(user);
  },
});

export const getUser = adapterQuery({
  args: {
    secret: v.string(),
    id: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    return mapUser(user);
  },
});

export const getUserByEmail = adapterQuery({
  args: {
    secret: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', args.email))
      .unique();
    return mapUser(user);
  },
});

export const getUserByAccount = adapterQuery({
  args: {
    secret: v.string(),
    provider: v.string(),
    providerAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query('accounts')
      .withIndex('providerAndAccountId', q =>
        q.eq('provider', args.provider).eq('providerAccountId', args.providerAccountId),
      )
      .unique();
    if (!account) return null;
    const user = await ctx.db.get(account.userId);
    return mapUser(user);
  },
});

export const updateUser = adapterMutation({
  args: {
    secret: v.string(),
    id: v.id('users'),
    data: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerified: v.optional(v.union(v.null(), v.number())),
      image: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      ...args.data,
      emailVerified: args.data.emailVerified ?? null,
    });
    const user = await ctx.db.get(args.id);
    return mapUser(user);
  },
});

export const deleteUser = adapterMutation({
  args: {
    secret: v.string(),
    id: v.id('users'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

export const linkAccount = adapterMutation({
  args: {
    secret: v.string(),
    data: v.object({
      userId: v.id('users'),
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
      refresh_token_expires_in: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('accounts', args.data);
    return args.data;
  },
});

export const unlinkAccount = adapterMutation({
  args: {
    secret: v.string(),
    provider: v.string(),
    providerAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query('accounts')
      .withIndex('providerAndAccountId', q =>
        q.eq('provider', args.provider).eq('providerAccountId', args.providerAccountId),
      )
      .unique();
    if (!account) return null;
    await ctx.db.delete(account._id);
    return true;
  },
});

export const getAccount = adapterQuery({
  args: {
    secret: v.string(),
    provider: v.string(),
    providerAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query('accounts')
      .withIndex('providerAndAccountId', q =>
        q.eq('provider', args.provider).eq('providerAccountId', args.providerAccountId),
      )
      .unique();
    if (!account) return null;
    return {
      userId: account.userId,
      type: account.type,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      refresh_token: account.refresh_token,
      access_token: account.access_token,
      expires_at: account.expires_at,
      token_type: account.token_type,
      scope: account.scope,
      id_token: account.id_token,
      session_state: account.session_state,
      refresh_token_expires_in: account.refresh_token_expires_in,
    };
  },
});

export const createSession = adapterMutation({
  args: {
    secret: v.string(),
    data: v.object({
      sessionToken: v.string(),
      userId: v.id('users'),
      expires: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('sessions', args.data);
    return args.data;
  },
});

export const getSessionAndUser = adapterQuery({
  args: {
    secret: v.string(),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('sessionToken', q => q.eq('sessionToken', args.sessionToken))
      .unique();
    if (!session) return null;
    const user = await ctx.db.get(session.userId);
    const mappedUser = mapUser(user);
    if (!mappedUser) return null;
    return {
      session: {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      },
      user: mappedUser,
    };
  },
});

export const updateSession = adapterMutation({
  args: {
    secret: v.string(),
    sessionToken: v.string(),
    data: v.object({
      sessionToken: v.optional(v.string()),
      userId: v.optional(v.id('users')),
      expires: v.optional(v.union(v.null(), v.number())),
    }),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('sessionToken', q => q.eq('sessionToken', args.sessionToken))
      .unique();
    if (!session) return null;
    await ctx.db.patch(session._id, {
      ...args.data,
      expires: args.data.expires ?? session.expires,
    });
    const updated = await ctx.db.get(session._id);
    if (!updated) return null;
    return {
      sessionToken: updated.sessionToken,
      userId: updated.userId,
      expires: updated.expires,
    };
  },
});

export const deleteSession = adapterMutation({
  args: {
    secret: v.string(),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('sessionToken', q => q.eq('sessionToken', args.sessionToken))
      .unique();
    if (!session) return null;
    await ctx.db.delete(session._id);
    return true;
  },
});

export const createVerificationToken = adapterMutation({
  args: {
    secret: v.string(),
    data: v.object({
      identifier: v.string(),
      token: v.string(),
      expires: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('verificationTokens', args.data);
    return args.data;
  },
});

export const useVerificationToken = adapterMutation({
  args: {
    secret: v.string(),
    identifier: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('verificationTokens')
      .withIndex('identifierToken', q =>
        q.eq('identifier', args.identifier).eq('token', args.token),
      )
      .unique();
    if (!existing) return null;
    await ctx.db.delete(existing._id);
    return {
      identifier: existing.identifier,
      token: existing.token,
      expires: existing.expires,
    };
  },
});

export const createAuthenticator = adapterMutation({
  args: {
    secret: v.string(),
    data: v.object({
      credentialID: v.string(),
      credentialPublicKey: v.string(),
      counter: v.number(),
      userId: v.id('users'),
      transports: v.optional(v.array(v.string())),
      credentialDeviceType: v.string(),
      credentialBackedUp: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('authenticators', args.data);
    return args.data;
  },
});

export const getAuthenticator = adapterQuery({
  args: {
    secret: v.string(),
    credentialID: v.string(),
  },
  handler: async (ctx, args) => {
    const authenticator = await ctx.db
      .query('authenticators')
      .withIndex('credentialID', q => q.eq('credentialID', args.credentialID))
      .unique();
    return authenticator ? { ...authenticator } : null;
  },
});

export const listAuthenticatorsByUser = adapterQuery({
  args: {
    secret: v.string(),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query('authenticators')
      .withIndex('userId', q => q.eq('userId', args.userId))
      .collect();
  },
});

export const updateAuthenticatorCounter = adapterMutation({
  args: {
    secret: v.string(),
    credentialID: v.string(),
    counter: v.number(),
  },
  handler: async (ctx, args) => {
    const authenticator = await ctx.db
      .query('authenticators')
      .withIndex('credentialID', q => q.eq('credentialID', args.credentialID))
      .unique();
    if (!authenticator) {
      throw new Error('Authenticator not found');
    }
    await ctx.db.patch(authenticator._id, { counter: args.counter });
    return {
      ...authenticator,
      counter: args.counter,
    };
  },
});
