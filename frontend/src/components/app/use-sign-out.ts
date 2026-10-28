'use client';

import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/store';
import { logoutUser } from '@/lib/api';

/**
 * Sign out: tell the backend, clear the local session, go to /login. The backend call is
 * best-effort — an expired token or an offline API must never trap someone signed in, so its
 * failure still ends the local session.
 */
export function useSignOut(): () => Promise<void> {
  const router = useRouter();
  const { logout } = useAppState();
  return async () => {
    await logoutUser().catch(() => undefined);
    logout();
    router.push('/login');
  };
}
