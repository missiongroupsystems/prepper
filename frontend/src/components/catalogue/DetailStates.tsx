/** Loading and failed-to-load states shared by the catalogue detail pages. */
import Link from 'next/link';
import { CircleAlert } from 'lucide-react';
import { EmptyState, Skeleton, buttonClasses } from '@/components/ui';

export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <Skeleton className="h-9 w-72 rounded-md" />
      <Skeleton className="h-40 rounded-lg" />
      <Skeleton className="h-56 rounded-lg" />
    </div>
  );
}

export function DetailLoadError({
  title,
  description = 'It may have been removed, or the connection dropped. Try again in a moment.',
  backHref,
  backLabel,
}: {
  title: string;
  description?: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <EmptyState
      icon={CircleAlert}
      title={title}
      description={description}
      action={
        <Link href={backHref} className={buttonClasses('secondary', 'md')}>
          {backLabel}
        </Link>
      }
    />
  );
}
