import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { TRPCProvider } from '@/lib/trpc/client';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return <TRPCProvider>{children}</TRPCProvider>;
}
