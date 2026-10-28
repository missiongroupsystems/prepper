/**
 * RecordCard and RecordRow — the grid card and the list row for one catalogue record (an
 * outlet, a tag, an allergen, a dish category). Title, a muted line under it, a one- or
 * two-line description, badges, and the record's visible action menu.
 *
 * With `href` the title is the link and its hit area stretches over the whole card, so the
 * card opens the record while the action menu (a button) stays outside the link.
 */
import type { ReactNode } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

interface RecordProps {
  title: string;
  /** A code or parent shown small above the title. */
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  description?: string | null;
  badges?: ReactNode;
  icon?: LucideIcon;
  href?: string;
  /** The RowActions menu. */
  actions?: ReactNode;
  className?: string;
}

function Title({ title, href, className }: { title: string; href?: string; className?: string }) {
  if (!href) return <h3 className={cn('text-base leading-snug font-medium text-ink break-words', className)}>{title}</h3>;
  return (
    <h3 className={cn('text-base leading-snug font-medium text-ink break-words', className)}>
      <Link
        href={href}
        className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:outline-2 focus-visible:after:outline-ring hover:underline"
      >
        {title}
      </Link>
    </h3>
  );
}

function RecordIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-surface-sunken text-tertiary">
      <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
    </span>
  );
}

export function RecordCard({ title, eyebrow, subtitle, description, badges, icon, href, actions, className }: RecordProps) {
  return (
    <Card interactive={Boolean(href)} className={cn('relative flex flex-col gap-3', className)}>
      <div className="flex items-start gap-3">
        {icon && <RecordIcon icon={icon} />}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {eyebrow}
          <Title title={title} href={href} />
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="relative z-10 -mr-2 -mt-1">{actions}</div>}
      </div>
      {description && <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>}
      {badges && <div className="flex flex-wrap items-center gap-1.5">{badges}</div>}
    </Card>
  );
}

export function RecordRow({ title, eyebrow, subtitle, description, badges, icon, href, actions, className }: RecordProps) {
  return (
    <Card interactive={Boolean(href)} className={cn('relative flex items-center gap-4 px-4 py-3', className)}>
      {icon && <RecordIcon icon={icon} />}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {eyebrow}
        <Title title={title} href={href} />
        {(subtitle || description) && (
          <p className="truncate text-sm text-muted-foreground">{subtitle ?? description}</p>
        )}
      </div>
      {badges && <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">{badges}</div>}
      {actions && <div className="relative z-10 -mr-1">{actions}</div>}
    </Card>
  );
}
