import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-medium text-foreground mb-6 pb-2 border-b border-border">{title}</h2>
      {children}
    </section>
  );
}

export function Subsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

/** A token swatch painted straight from its CSS custom property, so it follows the live theme. */
export function TokenSwatch({ token, label, utility }: { token: string; label: string; utility?: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className="size-10 shrink-0 rounded-md border border-border"
        style={{ background: `var(${token})` }}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">{utility ?? token}</p>
      </div>
    </div>
  );
}

export function SwatchGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-5 md:grid-cols-4', className)}>{children}</div>;
}
