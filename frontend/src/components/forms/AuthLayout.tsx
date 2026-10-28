/**
 * The sign-in and sign-up frame: the brand mark, one card centred in the viewport at a
 * comfortable 400px, a title and a line under it, the form, and the link to the other page.
 * Auth routes render outside the app shell, so this owns the full screen.
 */
import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/brand';
import { Card } from '@/components/ui';

export function AuthLayout({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: string;
  /** The "Don't have an account? Sign up" line under the card. */
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-5 py-10">
      <BrandLogo className="h-7 text-ink" />
      <Card className="flex w-full max-w-[25rem] flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="text-xl leading-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </Card>
      <p className="text-center text-sm text-muted-foreground">{footer}</p>
    </main>
  );
}

/** The form-level error under the fields — one alert, the danger tone. */
export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-md bg-danger-subtle px-3 py-2.5 text-sm text-danger">
      {children}
    </div>
  );
}
