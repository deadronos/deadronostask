import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';

import { ConvexClientProvider } from '@/lib/convex/convex-client-provider';
import '@/styles/globals.css';

const displayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '700'],
});

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Task Manager',
  description: 'A realtime task management application',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en">
        <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
          <ConvexClientProvider>
            {children}
            <Analytics />
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
