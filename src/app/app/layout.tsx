import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { AppProviders } from '@/components/AppProviders';
import { AppShell } from '@/components/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect('/');
  }

  return (
    <AppProviders session={session}>
      <AppShell>{children}</AppShell>
    </AppProviders>
  );
}
