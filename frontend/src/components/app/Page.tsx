/**
 * Page — the one content measure (styleguide §7.1), so gutters and reading width are decided
 * once: 1080px (`--content-max`), centred, with Workforce's gutters (22px on a phone, 32px from
 * `sm`, 48px with a 40px top from `lg`). Content scrolls in the shell's `<main>`.
 *
 * - default: the measure. Lists, forms, settings, detail pages.
 * - `wide`: the same gutters, no max-width. Dense tables that need the viewport.
 * - `fill`: a full-height workspace (the recipe canvas, the menu-sketch editor, version trees).
 *   No gutters, no measure, exactly the height of `<main>`, and nothing scrolls here: the
 *   workspace owns its own panes and their scroll.
 */
import { cn } from '@/lib/utils';

export function Page({
  wide = false,
  fill = false,
  className,
  children,
}: {
  /** Full-bleed width for dense data screens; keeps the gutters. */
  wide?: boolean;
  /** Full-height, full-bleed workspace with its own internal scroll. Overrides `wide`. */
  fill?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (fill) {
    return <div className={cn('flex h-full min-h-0 w-full flex-col overflow-hidden', className)}>{children}</div>;
  }
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:pb-16 lg:pt-10',
        !wide && 'max-w-(--content-max)',
        className
      )}
    >
      {children}
    </div>
  );
}
