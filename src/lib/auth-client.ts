'use client';

import { getSession, SessionProvider, signOut, useSession } from 'next-auth/react';

export { SessionProvider, signOut, useSession };

export async function getSessionClient() {
  return getSession();
}
