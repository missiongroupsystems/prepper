'use client';

/** The always-visible kebab on a catalogue table row. Items are `MenuItem`s from `@/components/ui`. */
import type { ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button, Menu } from '@/components/ui';

export function RowActionsMenu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Menu
      label={label}
      trigger={(props) => (
        <Button {...props} variant="ghost" size="icon" aria-label={label} className="text-muted-foreground">
          <MoreVertical className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </Button>
      )}
    >
      {children}
    </Menu>
  );
}
