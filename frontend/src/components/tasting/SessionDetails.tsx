'use client';

/**
 * The session's facts as labelled fields. The creator edits them in place: the name and place
 * autosave on commit, attendees on every change, and the date applies from the picker.
 * Everyone else reads them.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Badge, Button, Card, EditableCell } from '@/components/ui';
import type { TastingSession, UpdateTastingSessionRequest, User } from '@/types';
import { ParticipantPicker } from './ParticipantPicker';
import { SessionDateTimePicker } from './SessionDateTimePicker';
import { formatLongDate, formatTimeOfDay, parseDateTimeComponents, toOffsetDateTimeString, type TimeOfDay } from './sessionDate';

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'flex flex-col gap-1.5 sm:col-span-2' : 'flex flex-col gap-1.5'}>
      <dt className="text-[13px] font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}

const DEFAULT_TIME: TimeOfDay = { hour: '10', minute: '00', period: 'AM' };

interface SessionDetailsProps {
  session: TastingSession;
  isCreator: boolean;
  onUpdate: (data: UpdateTastingSessionRequest) => void;
}

export function SessionDetails({ session, isCreator, onUpdate }: SessionDetailsProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [time, setTime] = useState<TimeOfDay>(DEFAULT_TIME);

  const resetDateTime = (date: string) => {
    const parsed = parseDateTimeComponents(date);
    setSelectedDate(parsed.date);
    setTime(parsed);
  };

  // Initialize datetime state when the session loads or its date changes.
  useEffect(() => resetDateTime(session.date), [session.date]);

  const applyDateTime = () => {
    const next = selectedDate ? toOffsetDateTimeString(selectedDate, time) : '';
    if (next && next !== session.date) onUpdate({ date: next });
    setShowCalendar(false);
  };

  const cancelDateTime = () => {
    resetDateTime(session.date);
    setShowCalendar(false);
  };

  const participants = session.participants ?? [];
  const when = `${formatLongDate(session.date)} · ${formatTimeOfDay(time)}`;

  return (
    <Card>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        {isCreator && (
          <Field label="Name" wide>
            <EditableCell value={session.name} onSave={(value) => onUpdate({ name: value })} placeholder="Session name" />
          </Field>
        )}

        <Field label="Date and time">
          {isCreator && selectedDate ? (
            <SessionDateTimePicker
              date={selectedDate}
              time={time}
              open={showCalendar}
              onOpenChange={setShowCalendar}
              onDismiss={cancelDateTime}
              onDateChange={setSelectedDate}
              onTimeChange={setTime}
              footer={
                <>
                  <Button variant="secondary" size="sm" onClick={cancelDateTime}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={applyDateTime}>
                    Apply
                  </Button>
                </>
              }
            />
          ) : (
            <span className="tabular-nums">{when}</span>
          )}
        </Field>

        <Field label="Location">
          {isCreator ? (
            <EditableCell
              value={session.location || ''}
              onSave={(value) => onUpdate({ location: value || null })}
              placeholder="Add location"
            />
          ) : (
            session.location || <span className="text-muted-foreground">No location</span>
          )}
        </Field>

        <Field label="Attendees" wide>
          {isCreator ? (
            <ParticipantPicker
              selectedUsers={participants.map((p) => ({ id: p.user_id || '', email: p.email, username: p.username })) as User[]}
              onChange={(users) => onUpdate({ participant_ids: users.map((u) => u.id) })}
              creatorId={session.creator_id || ''}
            />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {participants.map((p) => (
                <Badge key={p.user_id} className="text-[13px]">
                  {p.username || p.email}
                  {p.user_id === session.creator_id && <span className="ml-1 text-tertiary">(organiser)</span>}
                </Badge>
              ))}
            </div>
          )}
        </Field>

        {session.notes && (
          <Field label="Notes" wide>
            <p className="leading-relaxed whitespace-pre-line text-muted-foreground">{session.notes}</p>
          </Field>
        )}
      </dl>
    </Card>
  );
}
