'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppState } from '@/lib/store';
import { completeOAuth } from '@/lib/api';

const DEFAULT_DESTINATION = '/outlets';

function isValidRedirectPath(path: string | null): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//');
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const { login } = useAppState();
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    // StrictMode double-invokes effects in dev — guard the one-shot exchange.
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const oauthError = params.get('error_description') || params.get('error');

      if (oauthError) {
        setError(oauthError);
        return;
      }
      if (!code) {
        router.replace('/login');
        return;
      }

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError || !data.session) {
        setError(exchangeError?.message || 'Could not establish session');
        return;
      }

      const { access_token, refresh_token } = data.session;

      let user;
      try {
        user = await completeOAuth(access_token);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not complete sign-in';
        setError(msg);
        // Clean up the Supabase session so the user isn't left in a half-auth state.
        await supabase.auth.signOut();
        return;
      }

      login(
        user.id,
        access_token,
        user.user_type,
        refresh_token,
        user.username,
        user.email,
        user.is_manager,
        user.outlet_id ?? null
      );

      const storedRedirect = localStorage.getItem('tasting_redirect_url');
      const storedLastRoute = localStorage.getItem('prepper_last_route');
      const raw = storedRedirect || storedLastRoute || DEFAULT_DESTINATION;
      const destination = isValidRedirectPath(raw) ? raw : DEFAULT_DESTINATION;

      localStorage.setItem('prepper_last_route', destination);
      if (storedRedirect) localStorage.removeItem('tasting_redirect_url');

      router.replace(destination);
    })();
  }, [router, login]);

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="max-w-sm text-center">
        {error ? (
          <>
            <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => router.replace('/login')}
              className="text-sm font-medium underline"
            >
              Back to login
            </button>
          </>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Completing sign-in…</p>
        )}
      </div>
    </div>
  );
}
