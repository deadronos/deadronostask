import { SignJWT, importPKCS8, type KeyLike } from 'jose';
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

import { ConvexAdapter } from '@/lib/convexAdapter';

const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(/\.cloud$/, '.site');
const CONVEX_AUTH_PRIVATE_KEY = process.env.CONVEX_AUTH_PRIVATE_KEY;

if (!process.env.AUTH_GITHUB_ID || !process.env.AUTH_GITHUB_SECRET) {
  console.warn('Missing AUTH_GITHUB_ID or AUTH_GITHUB_SECRET env vars.');
}

let cachedKey: KeyLike | null = null;

async function getPrivateKey() {
  if (!CONVEX_AUTH_PRIVATE_KEY) {
    throw new Error('Missing CONVEX_AUTH_PRIVATE_KEY env var');
  }
  if (!cachedKey) {
    cachedKey = await importPKCS8(CONVEX_AUTH_PRIVATE_KEY, 'RS256');
  }
  return cachedKey;
}

async function createConvexToken(userId: string) {
  if (!CONVEX_SITE_URL) {
    throw new Error('Missing NEXT_PUBLIC_CONVEX_URL env var');
  }
  const key = await getPrivateKey();
  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: 'convex-auth' })
    .setIssuer(CONVEX_SITE_URL)
    .setAudience('convex')
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID ?? '',
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? '',
    }),
  ],
  adapter: ConvexAdapter(),
  session: { strategy: 'database' },
  callbacks: {
    async session({ session, user }) {
      session.userId = user.id;
      session.convexToken = await createConvexToken(user.id);
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
});
