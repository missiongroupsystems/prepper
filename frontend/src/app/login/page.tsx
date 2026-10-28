'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button, Input, PendingButton } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';
import { AuthError, AuthLayout } from '@/components/forms/AuthLayout';
import { useAppState } from '@/lib/store';
import { loginUser } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { LAST_ROUTE_STORAGE_KEY } from '@/lib/storage-keys';
import type { AuthApiError } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  /** Only allow relative paths starting with `/` (blocks `javascript:`, `//`, etc.) */
  const isValidRedirectPath = (path: string) =>
    typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await loginUser(email, password);

      toast.success('Login successful');
      login(
        response.user.id,
        response.access_token,
        response.user.user_type,
        response.refresh_token,
        response.user.username,
        response.user.email,
        response.user.is_manager,
        response.user.outlet_id ?? null
      );

      // Determine redirect destination (priority: URL param > tasting redirect > last route > default)
      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get('redirect');
      const storedRedirect = localStorage.getItem('tasting_redirect_url');
      const storedLastRoute = localStorage.getItem(LAST_ROUTE_STORAGE_KEY);
      const raw = redirectParam || storedRedirect || storedLastRoute || '/outlets';
      const destination = isValidRedirectPath(raw) ? raw : '/outlets';

      // Persist destination so AuthGuard picks it up when it detects auth
      // state change (prevents race condition where AuthGuard redirects to
      // a stale route before router.push fires)
      localStorage.setItem(LAST_ROUTE_STORAGE_KEY, destination);

      // Clean up one-time tasting redirect
      if (storedRedirect) {
        localStorage.removeItem('tasting_redirect_url');
      }

      router.push(destination);
    } catch (err: unknown) {
      console.error('Login error:', err);
      const apiError = err as AuthApiError;
      const errorMessage = apiError.message || 'Invalid email or password';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Log in to Mission Recipes"
      description="Welcome back. Pick up where the kitchen left off."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-ink underline underline-offset-2 hover:no-underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <FormField id="email" label="Email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>
        <FormField id="password" label="Password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormField>
        {error && <AuthError>{error}</AuthError>}
        <PendingButton type="submit" className="w-full" pending={isLoading}>
          Log in
        </PendingButton>
      </form>

      <div className="flex items-center gap-3 text-sm text-tertiary">
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        Or continue with
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={isGoogleLoading}
        onClick={async () => {
          setIsGoogleLoading(true);
          setError('');
          try {
            const supabase = createClient();
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: window.location.origin + '/auth/callback',
              },
            });
            if (oauthError) {
              setError(oauthError.message);
              setIsGoogleLoading(false);
            }
          } catch {
            setError('An unexpected error occurred');
            setIsGoogleLoading(false);
          }
        }}
      >
        {/* Google's mark keeps its brand colours. */}
        <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {isGoogleLoading ? 'Redirecting…' : 'Sign in with Google'}
      </Button>
    </AuthLayout>
  );
}
