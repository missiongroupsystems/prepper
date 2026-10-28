/**
 * Page head (styleguide §7.1) — an optional sentence-case eyebrow, the 25px title, a
 * one-paragraph description on a 60ch measure, and the page's actions on the right. The
 * page's primary action lives in `actions`, once: one primary at most, then secondaries.
 */
import { cn } from '@/lib/utils';

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  /** Sentence-case kicker naming the section, e.g. "Kitchen · Dishes". */
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  /** Right-aligned controls. */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-x-6 gap-y-3', className)}>
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="text-[25px] leading-tight">{title}</h1>
        {description && <p className="max-w-[60ch] text-[14.5px] text-muted-foreground">{description}</p>}
      </div>
      {/* min-w-0, not shrink-0: allowed to shrink, the slot drops to its own line and its
          buttons wrap inside it instead of running off a phone screen. */}
      {actions && <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
