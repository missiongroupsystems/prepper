'use client';

/**
 * Button (Mission Systems CI §9, §12.2). A pill — the product's one button shape — with an
 * accent primary, a hairline-outlined secondary, a text-only ghost and a danger fill.
 * Hover shifts background/opacity only; never move, scale or shadow.
 *
 * Sizes are explicit heights so a button, an input and a select in one row share a baseline:
 * `sm` 32 · `md` 36 · `lg` 40 · `icon` 36 square · `icon-sm` 32 square. Below `sm` (a phone)
 * every size steps up to the 44px touch minimum (40px for `sm` / `icon-sm`).
 *
 * The pre-redesign names still work so no call site has to change: `default` → primary,
 * `outline` → secondary, `destructive` → danger; size `default` → md.
 */
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

type LegacyVariant = 'default' | 'outline' | 'destructive';
type LegacySize = 'default';

const LEGACY_VARIANTS: Record<LegacyVariant, ButtonVariant> = {
  default: 'primary',
  outline: 'secondary',
  destructive: 'danger',
};

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none ' +
  'transition-[background-color,border-color,opacity,color] duration-(--dur-quick) ease-(--ease-out-soft) ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] max-sm:h-10',
  md: 'h-9 px-4 text-sm max-sm:h-11',
  lg: 'h-10 px-5 text-sm max-sm:h-11',
  icon: 'size-9 px-0 max-sm:size-11',
  'icon-sm': 'size-8 px-0 max-sm:size-10',
};

const variants: Record<ButtonVariant, string> = {
  // Accent fill — the one primary action per view. Press is one step darker.
  primary:
    'bg-accent text-accent-foreground hover:opacity-90 active:bg-accent-press active:opacity-100 disabled:hover:opacity-50',
  // Outlined on the lifted surface — the default non-primary action.
  secondary:
    'border border-hairline-strong bg-card text-ink hover:bg-surface-hover active:bg-surface-active',
  ghost: 'bg-transparent text-ink hover:bg-surface-hover active:bg-surface-active',
  // Destructive confirm — the danger fill, never the accent.
  danger: 'bg-danger text-destructive-foreground hover:opacity-90 disabled:hover:opacity-50',
};

function resolveVariant(variant: ButtonVariant | LegacyVariant): ButtonVariant {
  return variant in LEGACY_VARIANTS ? LEGACY_VARIANTS[variant as LegacyVariant] : (variant as ButtonVariant);
}

/** The Button classes, for an anchor or `<Link>` that must look like one. */
export function buttonClasses(
  variant: ButtonVariant | LegacyVariant = 'secondary',
  size: ButtonSize | LegacySize = 'md',
  className?: string
): string {
  return cn(base, sizes[size === 'default' ? 'md' : size], variants[resolveVariant(variant)], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant | LegacyVariant;
  size?: ButtonSize | LegacySize;
  /** Disables the button and shows a spinner before the label. For a fixed-width pending state use PendingButton. */
  loading?: boolean;
  /** Append a decorative trailing arrow. */
  withArrow?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading = false, withArrow, disabled, children, ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {loading && <Spinner className="border-current/25 border-t-current" />}
      {children}
      {withArrow && <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />}
    </button>
  )
);

Button.displayName = 'Button';
