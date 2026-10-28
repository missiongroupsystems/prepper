/**
 * Card (§3.2, §9, §12.1). White lifted surface on the warm canvas, 0.5px hairline, 12px radius,
 * NO shadow — resting surfaces use a line; only things that float get a shadow.
 *
 * Unlike Workforce's card, the padding sits on the Card itself (p-5) and the parts stack inside
 * it — that is the shape ~35 Recipes call sites already use, so it is kept. Pass `p-0` for a
 * frame around edge-to-edge content.
 */
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Beige tile on a white ground (dashboard widgets, nested rows). */
  sunken?: boolean;
  /** The whole card is a link or opens something: pointer and a stronger hairline on hover. */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, sunken, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg p-5 text-card-foreground hairline',
        sunken ? 'bg-surface-sunken' : 'bg-card',
        interactive &&
          'cursor-pointer transition-[border-color,background-color] duration-(--dur-quick) hover:border-hairline-strong',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-start justify-between gap-2', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

/** Card / group title — 16px, weight 500. */
export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-base leading-tight font-medium text-ink', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-3 text-sm text-muted-foreground', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-4 flex items-center gap-3 border-t border-line pt-4', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
