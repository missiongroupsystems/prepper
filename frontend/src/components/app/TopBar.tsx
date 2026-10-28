'use client';

/**
 * Top bar (styleguide §7.1) — 58px, translucent over the content, a quiet line beneath. Left:
 * the breadcrumb, led by the brand mark below `lg`. Right: the environment pill (every tier but
 * production), then, below `lg` where the rail is hidden, the avatar-only user chip and the
 * menu button.
 *
 * Below `sm` the env pill leaves the row and straddles the bar's bottom edge, centred, as in
 * Workforce: at 375px the row has no room to spare. The bar (z-40) sits above `<main>` and
 * above the z-30 menu sheet that opens under it, so neither ever paints over the pill.
 *
 * The theme choice lives in the account menu, not here: it is a preference, not a page control.
 */
import Link from 'next/link';
import { BrandLogo } from '@/components/brand';
import { EnvBadge } from '@/components/env-badge/EnvBadge';
import type { AppEnvState } from '@/components/env-badge/env';
import { ContextCrumbs } from './ContextCrumbs';
import { MobileMenu } from './MobileMenu';
import { UserChip } from './UserChip';
import { HOME_HREF, type NavItem } from './nav';

export function TopBar({
  items,
  appEnv,
  build,
}: {
  items: readonly NavItem[];
  /** Resolved on the server (`readAppEnv`): `VERCEL` never reaches a client bundle. */
  appEnv: AppEnvState;
  build: string | null;
}) {
  return (
    <header className="relative z-40 flex h-bar shrink-0 items-center gap-2 border-b border-line bg-card/80 px-4 backdrop-blur-md lg:px-5">
      {/* At lg+ the wordmark sits on the rail; below it the bar is the only chrome, so the mark leads. */}
      <Link
        href={HOME_HREF}
        aria-label="Mission Recipes home"
        className="-ml-2.5 grid size-11 shrink-0 place-items-center rounded-full lg:hidden"
      >
        <BrandLogo variant="mark" className="size-6 text-accent" />
      </Link>
      <div className="min-w-0 flex-1">
        <ContextCrumbs items={items} />
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <EnvBadge
          env={appEnv}
          build={build}
          className="max-sm:absolute max-sm:left-1/2 max-sm:top-full max-sm:z-10 max-sm:-translate-x-1/2 max-sm:-translate-y-1/2"
        />
        <div className="lg:hidden">
          <UserChip compact />
        </div>
        <MobileMenu items={items} />
      </div>
    </header>
  );
}
