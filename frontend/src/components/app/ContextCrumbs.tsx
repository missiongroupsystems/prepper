'use client';

/**
 * Where you are, as one breadcrumb: the section (from the nav) and, on a page under it, the kind
 * of page ("Dish", "Edit menu"). Recipes has no organisation or company level, so this is
 * Workforce's `ContextCrumbs` without its switchers. The leaf is the current page; the section
 * links back to its list.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Slash } from 'lucide-react';
import { crumbsFor, type NavItem } from './nav';

export function ContextCrumbs({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  const { section, leaf } = crumbsFor(items, pathname);
  const sectionLabel = section?.label ?? 'Mission Recipes';

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-0.5">
      {leaf && section ? (
        <>
          <Link
            href={section.href}
            className="truncate rounded-sm px-1.5 text-sm text-muted-foreground transition-colors duration-(--dur-quick) hover:text-ink"
          >
            {sectionLabel}
          </Link>
          <Slash className="size-3.5 shrink-0 -rotate-12 text-hairline-strong" strokeWidth={1.5} aria-hidden="true" />
          <span aria-current="page" className="truncate px-1.5 text-sm font-medium text-ink">
            {leaf}
          </span>
        </>
      ) : (
        <span aria-current="page" className="truncate px-1.5 text-sm font-medium text-ink">
          {sectionLabel}
        </span>
      )}
    </nav>
  );
}
