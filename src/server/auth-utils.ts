import 'server-only';

import { SignJWT, importPKCS8 } from 'jose';

const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(/\.cloud$/, '.site');
const CONVEX_AUTH_PRIVATE_KEY = process.env.CONVEX_AUTH_PRIVATE_KEY;

let cachedKey: unknown = null;

async function getPrivateKey(): Promise<unknown> {
  if (!CONVEX_AUTH_PRIVATE_KEY) {
    throw new Error('Missing CONVEX_AUTH_PRIVATE_KEY env var');
  }
  if (!cachedKey) {
    cachedKey = await importPKCS8(CONVEX_AUTH_PRIVATE_KEY, 'RS256');
  }
  return cachedKey;
}

/**
 * Creates a Convex JWT token for the given user ID
 * This is server-only and should never be exposed to the client
 */
export async function createConvexToken(userId: string): Promise<string> {
  if (!CONVEX_SITE_URL) {
    throw new Error('Missing NEXT_PUBLIC_CONVEX_URL env var');
  }
  const key = await getPrivateKey();
  return (
    new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'convex-auth' })
      .setIssuer(CONVEX_SITE_URL)
      .setAudience('convex')
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime('1h')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- jose typing incompatibility across versions
      .sign(key as any)
  );
}
