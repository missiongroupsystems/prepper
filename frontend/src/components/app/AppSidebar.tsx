'use client';

/**
 * The rail (styleguide §7.1–7.3) — 232px, card surface, a quiet line on its right edge. Top to
 * bottom: the wordmark on the top bar's line, the grouped nav under uppercase section eyebrows,
 * then the collapse control and the user chip. Hidden below `lg`, where `MobileMenu` takes over.
 *
 * Active item: the selected-surface fill, weight 500, and an accent icon — the only green in
 * the rail. Collapsed (64px) shows icons only. This file just marks the parts (`rail-label`,
 * `rail-eyebrow`, the two logos); `styles/shell.css` decides what shows from `<html
 * data-sidebar>`, so the server render needs no stored value and a reload never flashes. When
 * collapsed, each link's label is its `aria-label` and a `data-tip` label shows on hover and
 * keyboard focus.
 */
import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/brand';
import { HOME_HREF, isNavItemActive, type NavItem } from './nav';
import { UserChip } from './UserChip';
import { applySidebarMode, readSidebarMode } from './sidebar-mode';

const EYEBROW_CLASSES = 'rail-eyebrow nav-eyebrow select-none px-2.5 pb-1.5';

function toggleSidebar() {
  const current = readSidebarMode(document.documentElement.dataset.sidebar);
  applySidebarMode(current === 'collapsed' ? 'expanded' : 'collapsed');
}

function SidebarToggle() {
  // One name per state; shell.css shows only the current one (`display: none` also drops the
  // other from the accessibility tree).
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      data-tip="Expand sidebar"
      className="flex h-10 items-center gap-3 rounded-[9px] px-2.5 text-sm text-tertiary transition-colors duration-(--dur-quick) hover:bg-surface-hover hover:text-ink"
    >
      <PanelLeft className="size-[18px] shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span className="rail-label">Collapse sidebar</span>
      <span className="rail-collapsed-only sr-only">Expand sidebar</span>
    </button>
  );
}

export function AppSidebar({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="app-rail relative hidden h-full shrink-0 lg:block" aria-label="Sidebar">
      <div className="flex h-full flex-col border-r border-line bg-card">
        <div className="rail-logo flex h-bar shrink-0 items-center px-4">
          <Link href={HOME_HREF} className="inline-flex w-fit items-center rounded-sm" aria-label="Mission Recipes home">
            <BrandLogo variant="short" className="rail-logo-short h-5 w-auto text-accent" />
            <BrandLogo variant="mark" className="rail-logo-mark size-6 text-accent" />
          </Link>
        </div>

        <nav aria-label="Main" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
          {items.map((item, i) => {
            const Icon = item.icon;
            const active = isNavItemActive(item, pathname);
            const showEyebrow = item.group !== items[i - 1]?.group;
            return (
              <Fragment key={item.href}>
                {showEyebrow && (
                  // Collapsed, the eyebrow's text hides and it becomes a hairline divider.
                  <p className={cn(EYEBROW_CLASSES, i === 0 ? 'rail-eyebrow-first pt-1' : 'pt-5')}>
                    <span className="rail-eyebrow-text">{item.group}</span>
                  </p>
                )}
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.label}
                  data-tip={item.label}
                  className={cn(
                    'flex items-center gap-3 whitespace-nowrap rounded-[9px] px-2.5 py-2 text-sm transition-colors duration-(--dur-quick)',
                    active
                      ? 'bg-surface-selected font-medium text-ink'
                      : 'font-normal text-muted-foreground hover:bg-surface-sunken hover:text-ink'
                  )}
                >
                  <Icon
                    className={cn('size-[18px] shrink-0', active ? 'text-accent' : 'text-tertiary')}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <span className="rail-label truncate">{item.label}</span>
                </Link>
              </Fragment>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2 px-3 pb-4 pt-2">
          <SidebarToggle />
          <UserChip />
        </div>
      </div>
    </aside>
  );
}
