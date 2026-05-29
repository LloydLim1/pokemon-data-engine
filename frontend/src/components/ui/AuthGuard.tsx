'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, AuthUser } from '@/lib/auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null | 'loading'>('loading');
  const router = useRouter();

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace('/login');
      return;
    }
    setUser(u);
  }, [router]);

  if (user === 'loading' || user === null) return null;
  return <>{children}</>;
}
