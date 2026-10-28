/**
 * The session a dish or ingredient was tasted in, as a labelled row: date, place, attendees.
 */
import type { ReactNode } from 'react';
import type { TastingSession } from '@/types';
import { formatLongDate } from './sessionDate';

export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-[13px] font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}

export function SessionFacts({ session, children }: { session: TastingSession; children?: ReactNode }) {
  const attendees = (session.participants ?? []).map((p) => p.username).join(', ');
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg bg-card p-5 hairline sm:grid-cols-2 lg:grid-cols-3">
      <Fact label="Tasted on">{formatLongDate(session.date)}</Fact>
      {session.location && <Fact label="Location">{session.location}</Fact>}
      {attendees && <Fact label="Attendees">{attendees}</Fact>}
      {children}
    </dl>
  );
}
