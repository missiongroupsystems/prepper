/**
 * A tasting session in the list: name, whose it is, date, place, attendees and the start of its
 * notes. Past sessions are quieter.
 */
import Link from 'next/link';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { TastingSession } from '@/types';
import { formatShortDate } from './sessionDate';

const NOTES_PREVIEW_LENGTH = 60;

interface TastingSessionCardProps {
  session: TastingSession;
  expired?: boolean;
  isOwn: boolean;
  isInvited: boolean;
}

export function TastingSessionCard({ session, expired, isOwn, isInvited }: TastingSessionCardProps) {
  const attendees = session.participants?.length ?? 0;
  const notesPreview = session.notes
    ? session.notes.substring(0, NOTES_PREVIEW_LENGTH) + (session.notes.length > NOTES_PREVIEW_LENGTH ? '…' : '')
    : null;

  return (
    <Link href={`/tastings/${session.id}`} className="block h-full rounded-lg">
      <Card interactive className={cn('flex h-full flex-col gap-3', expired && 'bg-surface-sunken')}>
        <div className="flex flex-wrap items-start gap-2">
          <p className={cn('min-w-0 flex-1 text-base font-medium', expired ? 'text-muted-foreground' : 'text-ink')}>
            {session.name}
          </p>
          {isOwn && <Badge variant="success" className="text-[13px]">Yours</Badge>}
          {!isOwn && isInvited && <Badge variant="info" className="text-[13px]">Invited</Badge>}
          {expired && <Badge className="text-[13px]">Past</Badge>}
        </div>

        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <Calendar className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            {formatShortDate(session.date)}
          </li>
          {session.location && (
            <li className="flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span className="truncate">{session.location}</span>
            </li>
          )}
          {attendees > 0 && (
            <li className="flex items-center gap-1.5 tabular-nums">
              <Users className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              {attendees} attendee{attendees !== 1 ? 's' : ''}
            </li>
          )}
        </ul>

        <p className="mt-auto truncate border-t border-line pt-3 text-sm text-tertiary">{notesPreview ?? 'No notes'}</p>
      </Card>
    </Link>
  );
}
