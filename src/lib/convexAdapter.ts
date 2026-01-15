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

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const ADAPTER_SECRET = process.env.CONVEX_AUTH_ADAPTER_SECRET;

if (!CONVEX_URL) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL for Convex adapter');
}
if (!ADAPTER_SECRET) {
  throw new Error('Missing CONVEX_AUTH_ADAPTER_SECRET for Convex adapter');
}

const client = new ConvexHttpClient(CONVEX_URL);

type ConvexUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: number | null;
  image?: string | null;
};

type ConvexAccount = AdapterAccount & { userId: string };

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
    name: user.name ?? null,
    email: user.email ?? null,
    emailVerified: toDate(user.emailVerified),
    image: user.image ?? null,
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
    transports: authenticator.transports ?? null,
    credentialDeviceType: authenticator.credentialDeviceType,
    credentialBackedUp: authenticator.credentialBackedUp,
  };
}

export function ConvexAdapter(): Adapter {
  return {
    async createUser(data) {
      const { id: _ignored, ...userData } = data;
      const user = await client.mutation(api.authAdapter.createUser, {
        secret: ADAPTER_SECRET,
        data: {
          ...userData,
          emailVerified: toEpoch(userData.emailVerified),
        },
      });
      return mapUser(user);
    },
    async getUser(id) {
      const user = await client.query(api.authAdapter.getUser, {
        secret: ADAPTER_SECRET,
        id,
      });
      return user ? mapUser(user) : null;
    },
    async getUserByEmail(email) {
      const user = await client.query(api.authAdapter.getUserByEmail, {
        secret: ADAPTER_SECRET,
        email,
      });
      return user ? mapUser(user) : null;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const user = await client.query(api.authAdapter.getUserByAccount, {
        secret: ADAPTER_SECRET,
        provider,
        providerAccountId,
      });
      return user ? mapUser(user) : null;
    },
    async updateUser(data) {
      const { id, ...userData } = data;
      const user = await client.mutation(api.authAdapter.updateUser, {
        secret: ADAPTER_SECRET,
        id,
        data: {
          ...userData,
          emailVerified: toEpoch(userData.emailVerified),
        },
      });
      return mapUser(user);
    },
    async deleteUser(id) {
      await client.mutation(api.authAdapter.deleteUser, {
        secret: ADAPTER_SECRET,
        id,
      });
    },
    async linkAccount(data) {
      const account = await client.mutation(api.authAdapter.linkAccount, {
        secret: ADAPTER_SECRET,
        data,
      });
      return account as AdapterAccount;
    },
    async unlinkAccount({ provider, providerAccountId }) {
      await client.mutation(api.authAdapter.unlinkAccount, {
        secret: ADAPTER_SECRET,
        provider,
        providerAccountId,
      });
    },
    async createSession(data) {
      const session = await client.mutation(api.authAdapter.createSession, {
        secret: ADAPTER_SECRET,
        data: {
          ...data,
          expires: data.expires.getTime(),
        },
      });
      return mapSession(session);
    },
    async getSessionAndUser(sessionToken) {
      const result = await client.query(api.authAdapter.getSessionAndUser, {
        secret: ADAPTER_SECRET,
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
        secret: ADAPTER_SECRET,
        sessionToken: data.sessionToken,
        data: {
          ...data,
          expires: toEpoch(data.expires),
        },
      });
      return session ? mapSession(session) : null;
    },
    async deleteSession(sessionToken) {
      await client.mutation(api.authAdapter.deleteSession, {
        secret: ADAPTER_SECRET,
        sessionToken,
      });
    },
    async createVerificationToken(data) {
      const token = await client.mutation(api.authAdapter.createVerificationToken, {
        secret: ADAPTER_SECRET,
        data: {
          ...data,
          expires: data.expires.getTime(),
        },
      });
      return mapVerificationToken(token);
    },
    async useVerificationToken(params) {
      const token = await client.mutation(api.authAdapter.useVerificationToken, {
        secret: ADAPTER_SECRET,
        identifier: params.identifier,
        token: params.token,
      });
      return token ? mapVerificationToken(token) : null;
    },
    async getAccount(providerAccountId) {
      const account = await client.query(api.authAdapter.getAccount, {
        secret: ADAPTER_SECRET,
        provider: providerAccountId.provider,
        providerAccountId: providerAccountId.providerAccountId,
      });
      return account as AdapterAccount | null;
    },
    async createAuthenticator(data) {
      const authenticator = await client.mutation(api.authAdapter.createAuthenticator, {
        secret: ADAPTER_SECRET,
        data,
      });
      return mapAuthenticator(authenticator);
    },
    async getAuthenticator(credentialID) {
      const authenticator = await client.query(api.authAdapter.getAuthenticator, {
        secret: ADAPTER_SECRET,
        credentialID,
      });
      return authenticator ? mapAuthenticator(authenticator) : null;
    },
    async listAuthenticatorsByUser(userId) {
      const authenticators = await client.query(api.authAdapter.listAuthenticatorsByUser, {
        secret: ADAPTER_SECRET,
        userId,
      });
      return authenticators.map(mapAuthenticator);
    },
    async updateAuthenticatorCounter(credentialID, counter) {
      const authenticator = await client.mutation(api.authAdapter.updateAuthenticatorCounter, {
        secret: ADAPTER_SECRET,
        credentialID,
        counter,
      });
      return mapAuthenticator(authenticator);
    },
  } as Adapter;
}
