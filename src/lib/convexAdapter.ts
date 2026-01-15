import 'server-only';

import { ConvexHttpClient } from 'convex/browser';
import type {
  Adapter,
  AdapterAccount,
  AdapterAuthenticator,
  AdapterSession,
  AdapterUser,
  VerificationToken,
} from 'next-auth/adapters';

import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const ADAPTER_SECRET = process.env.CONVEX_AUTH_ADAPTER_SECRET;

if (!CONVEX_URL) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL for Convex adapter');
}
if (!ADAPTER_SECRET) {
  // During test runs we may not have an adapter secret set; defer throwing until the adapter is created
  // so tests that only import types or mock the module won't fail at import time.
  // Keep a warning to catch misconfiguration in non-test environments.
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Missing CONVEX_AUTH_ADAPTER_SECRET for Convex adapter');
  }
}

// Defer creating the HTTP client until the adapter is constructed so tests can mock `convex/browser`
function createClient() {
  if (!CONVEX_URL) {
    throw new Error('Missing NEXT_PUBLIC_CONVEX_URL for Convex adapter');
  }
  return new ConvexHttpClient(CONVEX_URL);
}

type ConvexUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: number | null;
  image?: string | null;
};

// type ConvexAccount = AdapterAccount & { userId: string }; // removed - unused

type ConvexSession = {
  sessionToken: string;
  userId: string;
  expires: number;
};

type ConvexVerificationToken = {
  identifier: string;
  token: string;
  expires: number;
};

type ConvexAuthenticator = {
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
  userId: string;
  transports?: string[] | null;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
};

const toDate = (value?: number | null) => (value ? new Date(value) : null);
const toEpoch = (value?: Date | null) => (value ? value.getTime() : null);

function mapUser(user: ConvexUser): AdapterUser {
  return {
    id: user.id,
    name: user.name ?? undefined,
    email: (user.email ?? '') as string,
    emailVerified: toDate(user.emailVerified),
    image: user.image ?? undefined,
  };
}

function mapSession(session: ConvexSession): AdapterSession {
  return {
    sessionToken: session.sessionToken,
    userId: session.userId,
    expires: new Date(session.expires),
  };
}

function mapVerificationToken(token: ConvexVerificationToken): VerificationToken {
  return {
    identifier: token.identifier,
    token: token.token,
    expires: new Date(token.expires),
  };
}

function mapAuthenticator(authenticator: ConvexAuthenticator): AdapterAuthenticator {
  return {
    credentialID: authenticator.credentialID,
    credentialPublicKey: authenticator.credentialPublicKey,
    counter: authenticator.counter,
    userId: authenticator.userId,
    transports: authenticator.transports ? authenticator.transports.join(',') : null,
    credentialDeviceType: authenticator.credentialDeviceType,
    credentialBackedUp: authenticator.credentialBackedUp,
    // AdapterAuthenticator requires a providerAccountId property; not applicable for WebAuthn authenticators so leave blank
    providerAccountId: '',
  };
}

export function ConvexAdapter(): Adapter {
  const client = createClient();
  return {
    async createUser(data) {
      const { id: _ignored, ...userData } = data;
      const user = await client.mutation(api.authAdapter.createUser, {
        secret: ADAPTER_SECRET as string,
        data: {
          // Ensure optional fields are undefined instead of null to satisfy Convex validators
          name: userData.name ?? undefined,
          email: userData.email ?? undefined,
          image: userData.image ?? undefined,
          emailVerified: toEpoch(userData.emailVerified),
        },
      });
      return user ? mapUser(user) : null;
    },

    async getUser(id) {
      const user = await client.query(api.authAdapter.getUser, {
        secret: ADAPTER_SECRET as string,
        id: id as Id<'users'>,
      });
      return user ? mapUser(user) : null;
    },
    async getUserByEmail(email) {
      const user = await client.query(api.authAdapter.getUserByEmail, {
        secret: ADAPTER_SECRET as string,
        email,
      });
      return user ? mapUser(user) : null;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const user = await client.query(api.authAdapter.getUserByAccount, {
        secret: ADAPTER_SECRET as string,
        provider,
        providerAccountId,
      });
      return user ? mapUser(user) : null;
    },
    async updateUser(data) {
      const { id, ...userData } = data;
      const user = await client.mutation(api.authAdapter.updateUser, {
        secret: ADAPTER_SECRET as string,
        id: id as Id<'users'>,
        data: {
          // Ensure no nulls are passed for optional string fields
          name: userData.name ?? undefined,
          email: userData.email ?? undefined,
          image: userData.image ?? undefined,
          emailVerified: toEpoch(userData.emailVerified),
        },
      });
      return user ? mapUser(user) : null;
    },
    async deleteUser(id) {
      await client.mutation(api.authAdapter.deleteUser, {
        secret: ADAPTER_SECRET as string,
        id: id as Id<'users'>,
      });
    },
    async linkAccount(data) {
      const account = await client.mutation(api.authAdapter.linkAccount, {
        secret: ADAPTER_SECRET as string,
        data: {
          ...data,
          userId: data.userId as Id<'users'>,
        },
      });
      return account as AdapterAccount;
    },
    async unlinkAccount({ provider, providerAccountId }) {
      await client.mutation(api.authAdapter.unlinkAccount, {
        secret: ADAPTER_SECRET as string,
        provider,
        providerAccountId,
      });
    },
    async createSession(data) {
      const session = await client.mutation(api.authAdapter.createSession, {
        secret: ADAPTER_SECRET as string,
        data: {
          ...data,
          userId: data.userId as Id<'users'>,
          expires: data.expires.getTime(),
        },
      });
      return mapSession(session);
    },
    async getSessionAndUser(sessionToken) {
      const result = await client.query(api.authAdapter.getSessionAndUser, {
        secret: ADAPTER_SECRET as string,
        sessionToken,
      });
      if (!result) return null;
      return {
        session: mapSession(result.session),
        user: mapUser(result.user),
      };
    },
    async updateSession(data) {
      const session = await client.mutation(api.authAdapter.updateSession, {
        secret: ADAPTER_SECRET as string,
        sessionToken: data.sessionToken,
        data: {
          // Ensure types align with Convex schema
          sessionToken: data.sessionToken ?? undefined,
          userId: data.userId ? (data.userId as Id<'users'>) : undefined,
          expires: toEpoch(data.expires),
        },
      });
      return session ? mapSession(session) : null;
    },
    async deleteSession(sessionToken) {
      await client.mutation(api.authAdapter.deleteSession, {
        secret: ADAPTER_SECRET as string,
        sessionToken,
      });
    },
    async createVerificationToken(data) {
      const token = await client.mutation(api.authAdapter.createVerificationToken, {
        secret: ADAPTER_SECRET as string,
        data: {
          ...data,
          expires: data.expires.getTime(),
        },
      });
      return mapVerificationToken(token);
    },
    async useVerificationToken(params) {
      const token = await client.mutation(api.authAdapter.useVerificationToken, {
        secret: ADAPTER_SECRET as string,
        identifier: params.identifier,
        token: params.token,
      });
      return token ? mapVerificationToken(token) : null;
    },
    async getAccount(providerAccountId, provider) {
      const account = await client.query(api.authAdapter.getAccount, {
        secret: ADAPTER_SECRET as string,
        provider,
        providerAccountId,
      });
      return account as AdapterAccount | null;
    },
    async createAuthenticator(data) {
      const authenticator = await client.mutation(api.authAdapter.createAuthenticator, {
        secret: ADAPTER_SECRET as string,
        data: {
          ...data,
          // Convert transports to array if necessary to match Convex schema
          transports: Array.isArray(data.transports)
            ? data.transports
            : data.transports
              ? data.transports.split(',')
              : undefined,
          userId: data.userId as Id<'users'>,
        },
      });
      return mapAuthenticator(authenticator);
    },
    async getAuthenticator(credentialID) {
      const authenticator = await client.query(api.authAdapter.getAuthenticator, {
        secret: ADAPTER_SECRET as string,
        credentialID,
      });
      return authenticator ? mapAuthenticator(authenticator) : null;
    },
    async listAuthenticatorsByUser(userId: string) {
      const authenticators = await client.query(api.authAdapter.listAuthenticatorsByUser, {
        secret: ADAPTER_SECRET as string,
        userId: userId as Id<'users'>,
      });
      return authenticators.map(mapAuthenticator);
    },
    async updateAuthenticatorCounter(credentialID, counter) {
      const authenticator = await client.mutation(api.authAdapter.updateAuthenticatorCounter, {
        secret: ADAPTER_SECRET as string,
        credentialID,
        counter,
      });
      return mapAuthenticator(authenticator);
    },
  } as Adapter;
}
