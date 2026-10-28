/**
 * The non-content states of the tasting pages: loading, not found, and access denied. Each keeps
 * the page's measure so nothing jumps when the content arrives.
 */
import Link from 'next/link';
import { ArrowLeft, Lock, SearchX } from 'lucide-react';
import { Page } from '@/components/app';
import { EmptyState, Skeleton, buttonClasses } from '@/components/ui';

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-ml-1 inline-flex min-h-9 items-center gap-1.5 self-start rounded-md px-1 text-sm text-muted-foreground transition-colors hover:text-ink max-sm:min-h-11"
    >
      <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
      {label}
    </Link>
  );
}

export function TastingPageSkeleton() {
  return (
    <Page>
      <div role="status" aria-label="Loading" className="flex flex-col gap-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </Page>
  );
}

export function TastingNotFound({ title, backHref, backLabel }: { title: string; backHref: string; backLabel: string }) {
  return (
    <Page>
      <EmptyState
        icon={SearchX}
        title={title}
        description="It may have been deleted, or the link is wrong."
        action={
          <Link href={backHref} className={buttonClasses('secondary', 'md')}>
            {backLabel}
          </Link>
        }
      />
    </Page>
  );
}

export function TastingAccessDenied() {
  return (
    <Page>
      <EmptyState
        icon={Lock}
        title="Access denied"
        description="You are not invited to this tasting session."
        action={
          <Link href="/rnd" className={buttonClasses('secondary', 'md')}>
            Back to R&amp;D
          </Link>
        }
      />
    </Page>
  );
}
