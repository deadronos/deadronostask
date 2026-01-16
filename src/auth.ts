import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

import { createConvexToken } from '@/server/auth-utils';
import { ConvexAdapter } from '@/server/convexAdapter';

if (!process.env.AUTH_GITHUB_ID || !process.env.AUTH_GITHUB_SECRET) {
  console.warn('Missing AUTH_GITHUB_ID or AUTH_GITHUB_SECRET env vars.');
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
