'use client';

/**
 * The app shell (styleguide §7) — a fixed-height frame: the rail on the left, and on the right
 * a column of top bar and a scrolling `<main>`. The frame owns the viewport so the rail and bar
 * stay put while content scrolls. Below `lg` the rail hides and the top bar's menu button opens
 * the nav as a sheet (`MobileMenu`).
 *
 * `<main>` scrolls (`overflow-y-auto`) and has a definite height, so a page can either flow and
 * let it scroll (`Page`), or take `h-full` and scroll its own panes (`Page fill`, and every
 * page that still carries its own `h-full overflow-auto` root from before the shell).
 *
 * Auth pages and the passthrough bridges render bare — no rail, no bar — as does anything
 * shown while signed out. AuthGuard (lib/providers.tsx) has already decided whether the route
 * may render at all; this only decides the chrome.
 */
import { usePathname } from 'next/navigation';
import { useAppState } from '@/lib/store';
import type { AppEnvState } from '@/components/env-badge/env';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { navForUser } from './nav';

const BARE_ROUTE_PATTERNS: readonly RegExp[] = [
  /^\/$/, // redirects on mount
  /^\/login$/,
  /^\/register$/,
  /^\/auth\/callback$/,
  /^\/tastings\/invite\/[^/]+$/,
];

function isBareRoute(pathname: string): boolean {
  return BARE_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function AppShell({
  appEnv,
  build,
  children,
}: {
  appEnv: AppEnvState;
  build: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { userId, userType } = useAppState();

  if (!userId || isBareRoute(pathname)) {
    return <main className="h-dvh overflow-y-auto">{children}</main>;
  }

  const items = navForUser(userType);
  return (
    <div className="flex h-dvh min-h-0">
      <AppSidebar items={items} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar items={items} appEnv={appEnv} build={build} />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
