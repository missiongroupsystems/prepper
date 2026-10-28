'use client';

/**
 * The phone/tablet menu (below `lg`, where the rail is hidden) — a round menu button in the top
 * bar and a full-height nav sheet under it, as Workforce's `mobile-menu`. The nav is grouped as
 * on the rail, with hairlines between groups instead of eyebrows; each row is 46px with its rail
 * icon, the current page tinted with an accent icon.
 *
 * It closes on X, Escape, a press outside and navigation: a link closes it on click, and the
 * open state is keyed to the pathname it was opened on, so any other navigation closes it too.
 * Portalled to <body> because the top bar's `backdrop-blur` would otherwise become the
 * containing block for the fixed sheet and pin it inside the 58px bar.
 */
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu as MenuIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupNav, isNavItemActive, type NavItem } from './nav';
import { useDismiss } from './use-dismiss';

const SHEET_ID = 'mobile-menu-sheet';

const barIconButtonClasses =
  'grid size-11 place-items-center rounded-full hairline text-tertiary transition-colors duration-(--dur-quick) hover:bg-surface-hover hover:text-ink';

function NavSheet({
  items,
  pathname,
  onClose,
  triggerRef,
}: {
  items: readonly NavItem[];
  pathname: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const ref = useDismiss<HTMLDivElement>(true, onClose, { ignore: triggerRef, lockScroll: true });
  return (
    <div
      ref={ref}
      id={SHEET_ID}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-x-0 bottom-0 top-bar z-30 flex flex-col overflow-y-auto bg-card px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:hidden"
    >
      <nav aria-label="Main">
        {groupNav(items).map((group, i) => (
          <div key={group[0]?.group ?? i} className={cn(i > 0 && 'mt-2 border-t border-line pt-2')}>
            {group.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(item, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[46px] items-center gap-3.5 rounded-lg px-3 text-[15px] text-ink transition-colors duration-(--dur-quick) hover:bg-surface-hover',
                    active && 'bg-surface-selected font-medium'
                  )}
                >
                  <Icon
                    className={cn('size-5 shrink-0', active ? 'text-accent' : 'text-tertiary')}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}

export function MobileMenu({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  // The pathname the sheet was opened on; navigating anywhere else closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isOpen = openOn === pathname;
  const label = isOpen ? 'Close menu' : 'Open menu';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={isOpen ? SHEET_ID : undefined}
        aria-label={label}
        title={label}
        onClick={() => setOpenOn(isOpen ? null : pathname)}
        className={cn(barIconButtonClasses, 'lg:hidden')}
      >
        {isOpen ? (
          <X className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <MenuIcon className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
        )}
      </button>
      {isOpen &&
        createPortal(
          <NavSheet items={items} pathname={pathname} onClose={() => setOpenOn(null)} triggerRef={triggerRef} />,
          document.body
        )}
    </>
  );
}
