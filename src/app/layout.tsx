import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';

import { ConvexClientProvider } from '@/lib/convex/ConvexClientProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Task Manager',
  description: 'A realtime task management application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
