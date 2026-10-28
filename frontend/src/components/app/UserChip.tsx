'use client';

/**
 * User chip (styleguide §7.2) — the signed-in person at the foot of the rail: initials on the
 * accent tint, name, role, and an account menu that opens upward with the theme choice and
 * sign-out. Below `lg` the rail is hidden, so the same chip renders avatar-only (`compact`) in
 * the top bar and its menu opens downward. In the collapsed rail `styles/shell.css` shrinks the
 * full chip to its avatar; its accessible name still says whose it is.
 */
import { useRef, useState } from 'react';
import { ChevronsUpDown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '@/lib/store';
import { ThemeToggle } from '@/components/theme';
import { useDismiss } from './use-dismiss';
import { useSignOut } from './use-sign-out';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

function roleLabelOf(userType: 'normal' | 'admin' | null, isManager: boolean): string {
  if (userType === 'admin') return 'Admin';
  return isManager ? 'Manager' : 'Member';
}

export function UserChip({ compact = false }: { compact?: boolean }) {
  const { username, email, userType, isManager } = useAppState();
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useDismiss<HTMLDivElement>(open, () => setOpen(false), { ignore: triggerRef });

  const name = username ?? email ?? 'Account';
  const role = roleLabelOf(userType, isManager);
  const avatar = (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-medium text-accent',
        compact && 'max-lg:size-11 max-lg:text-[13px]'
      )}
    >
      {initialsOf(name)}
    </span>
  );

  return (
    <div className={cn('relative', !compact && 'w-full')}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Account menu for ${name}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          compact
            ? 'rounded-full'
            : 'rail-chip flex w-full items-center gap-2.5 rounded-lg border border-line p-2 text-left transition-colors duration-(--dur-quick) hover:bg-surface-hover'
        )}
      >
        {avatar}
        {!compact && (
          <>
            <span className="rail-label flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] font-medium leading-tight text-ink">{name}</span>
              <span className="truncate text-[11px] leading-tight text-tertiary">{role}</span>
            </span>
            <ChevronsUpDown className="rail-label size-4 shrink-0 text-tertiary" strokeWidth={1.5} aria-hidden="true" />
          </>
        )}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="dialog"
          aria-label="Account"
          className={cn(
            'absolute z-50 flex w-64 flex-col gap-1 rounded-lg border border-line bg-popover p-1.5 text-popover-foreground shadow-pop',
            compact ? 'right-0 top-full mt-2' : 'bottom-full left-0 mb-2'
          )}
        >
          <div className="px-2.5 pb-2 pt-1.5">
            <p className="truncate text-[13px] font-medium text-ink">{name}</p>
            <p className="truncate text-[11px] text-tertiary">{email && email !== name ? `${role} · ${email}` : role}</p>
          </div>
          <div className="flex flex-col gap-1.5 border-t border-line px-2.5 py-2.5">
            <p className="text-[11px] text-tertiary">Theme</p>
            <ThemeToggle className="w-full justify-between" />
          </div>
          <div className="border-t border-line pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-danger transition-colors duration-(--dur-quick) hover:bg-danger-subtle lg:min-h-9"
            >
              <LogOut className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
