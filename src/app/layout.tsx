import type { Metadata } from 'next';
import { Space_Grotesk, Fraunces } from 'next/font/google';

import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/Toaster';

const bodyFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

const displayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  title: 'Taskflow',
  description: 'A modern Convex-powered task manager',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
