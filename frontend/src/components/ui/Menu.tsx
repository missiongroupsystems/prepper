'use client';

/**
 * Menu (§12.7) — a small anchored dropdown for row actions and the user chip. The caller renders
 * the trigger through a render prop, so the menu can wrap a Button, an icon button or a chip.
 *
 * Keyboard: ArrowDown/ArrowUp on the trigger opens; the first item takes focus; arrows, Home and
 * End move; Escape closes and returns focus to the trigger; Tab closes; click outside closes.
 * Items are buttons or (with `href`) Next links.
 *
 * Portalled to `<body>` and placed against the viewport (`menuPlacement`), so a row menu in the
 * last rows of a framed table is never clipped. It follows the trigger on scroll and resize, and
 * sits at z-60 so a menu inside a SidePanel still shows.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAnchoredDismiss } from './useAnchoredDismiss';
import { placeMenu, type MenuPlacement } from './menuPlacement';
import { Portal } from './Portal';

export interface MenuTriggerProps {
  ref: Ref<HTMLButtonElement>;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
}

const ITEM_ROLES = '[role="menuitem"], [role="menuitemradio"]';
const ITEM_SELECTOR = ':is([role="menuitem"], [role="menuitemradio"]):not([aria-disabled="true"])';

export function Menu({
  trigger,
  align = 'end',
  side = 'bottom',
  label,
  className,
  children,
}: {
  trigger: (props: MenuTriggerProps) => ReactNode;
  align?: 'start' | 'end';
  /** `top` opens upward — for a trigger pinned to the bottom of the screen. */
  side?: 'bottom' | 'top';
  /** Names the menu for a screen reader — "Recipe actions". */
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<MenuPlacement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);
  const dismiss = useCallback(() => setOpen(false), []);
  const { onKeyDown: onEscapeKey } = useAnchoredDismiss({
    open,
    triggerRef,
    panelRef: listRef,
    onPointerOutside: dismiss,
    onEscape: close,
  });

  // Place against the trigger, again once the menu has a size to flip on, and follow the trigger.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const triggerEl = triggerRef.current;
    const place = () => {
      const list = listRef.current;
      setPlacement(
        placeMenu({
          trigger: triggerEl.getBoundingClientRect(),
          menu: list ? { width: list.offsetWidth, height: list.offsetHeight } : null,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          side,
          align,
        })
      );
    };
    let raf = window.requestAnimationFrame(place);
    const update = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(place);
    };
    place();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      setPlacement(null);
    };
  }, [open, side, align]);

  // A menu takes focus on open: its items are why it exists, and the arrows need a start.
  useEffect(() => {
    if (!open) return;
    const raf = window.requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [open]);

  const onListKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);
    if (items.length === 0) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? items.length - 1
          : e.key === 'ArrowDown'
            ? (i + 1) % items.length
            : (i - 1 + items.length) % items.length;
    items[next].focus();
  };

  return (
    <div className={cn('relative inline-flex', className)} onKeyDown={onEscapeKey}>
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen((v) => !v),
        onKeyDown: (e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
          }
        },
        'aria-haspopup': 'menu',
        'aria-expanded': open,
      })}
      {open && (
        <Portal>
          <div
            ref={listRef}
            role="menu"
            aria-label={label}
            onKeyDown={onListKey}
            onClick={(e) => {
              // Any item activation closes the menu; the item's own handler has already run.
              if ((e.target as HTMLElement).closest(ITEM_ROLES)) setOpen(false);
            }}
            // Computed offsets from the trigger's rectangle — the one thing a utility cannot say.
            style={placement ?? undefined}
            className={cn(
              'animate-pop-in fixed z-60 min-w-44 overflow-hidden rounded-lg bg-popover p-1 shadow-pop hairline',
              !placement && 'invisible'
            )}
          >
            {children}
          </div>
        </Portal>
      )}
    </div>
  );
}

const itemClasses =
  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-ink outline-none ' +
  'transition-colors duration-(--dur-quick) hover:bg-surface-hover focus-visible:bg-surface-hover ' +
  'aria-disabled:cursor-not-allowed aria-disabled:text-disabled aria-disabled:hover:bg-transparent';

export function MenuItem({
  onSelect,
  href,
  danger,
  disabled,
  icon: Icon,
  children,
}: {
  onSelect?: () => void;
  href?: string;
  /** Destructive — the danger tone, never the accent. Pair with ConfirmModal. */
  danger?: boolean;
  disabled?: boolean;
  icon?: ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: 'true' }>;
  children: ReactNode;
}) {
  const tone = danger ? 'text-danger hover:bg-danger-subtle focus-visible:bg-danger-subtle' : '';
  const content = (
    <>
      {Icon && <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />}
      {children}
    </>
  );
  if (href && !disabled) {
    return (
      <Link href={href} role="menuitem" tabIndex={-1} className={cn(itemClasses, tone)} onClick={onSelect}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      role="menuitem"
      aria-disabled={disabled || undefined}
      tabIndex={-1}
      onClick={disabled ? undefined : onSelect}
      className={cn(itemClasses, tone)}
    >
      {content}
    </button>
  );
}

/** One choice of several, picked in place. The dot is ink, not the accent. */
export function MenuRadioItem({
  checked,
  onSelect,
  children,
}: {
  checked: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      tabIndex={-1}
      onClick={onSelect}
      className={itemClasses}
    >
      <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center">
        {checked && <span className="size-1.5 rounded-full bg-ink" />}
      </span>
      {children}
    </button>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="my-1 border-t border-line" />;
}
