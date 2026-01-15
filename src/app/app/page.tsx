'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AppIndex() {
  const router = useRouter();

  useEffect(() => {
    const view = window.localStorage.getItem('defaultView') ?? 'today';
    router.replace(`/app/${view}`);
  }, [router]);

  return null;
}
