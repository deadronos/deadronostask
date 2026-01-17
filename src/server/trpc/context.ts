import { auth } from '@clerk/nextjs/server';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

export async function createContext(_options?: FetchCreateContextFnOptions) {
  const session = await auth();

  return {
    session,
    userId: session?.userId,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
