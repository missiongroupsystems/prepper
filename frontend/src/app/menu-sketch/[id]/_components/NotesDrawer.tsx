'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Check, ChevronUp } from 'lucide-react';
import { Page } from '@/components/app';
import { cn } from '@/lib/utils';

const NotesEditor = dynamic(() => import('../NotesEditor').then((m) => m.NotesEditor), { ssr: false });

/** Menu-wide notes, pinned under the editor; same measure as the page. */
export function NotesDrawer({ notes, onSave }: { notes: string | null | undefined; onSave: (html: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="shrink-0 hairline-t bg-card">
      <Page className="gap-0 py-0 sm:py-0 lg:py-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex h-11 w-full items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-ink"
        >
          <ChevronUp
            className={cn('size-4 transition-transform duration-(--dur-base)', open && 'rotate-180')}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          Notes
          {notes && !open && (
            <Check className="ml-auto size-4 text-success" strokeWidth={1.5} aria-label="Has notes" />
          )}
        </button>
        {open && (
          <div className="max-h-56 overflow-y-auto pb-4">
            <NotesEditor initialContent={notes ?? ''} onChange={() => {}} onSave={onSave} />
          </div>
        )}
      </Page>
    </div>
  );
}
