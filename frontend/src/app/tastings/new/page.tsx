'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FlaskConical } from 'lucide-react';
import { format } from 'date-fns';
import { useCreateTastingSession, useAddRecipesToSession } from '@/lib/hooks/useTastings';
import { useSendTastingInvitation } from '@/lib/hooks/useSendTastingInvitation';
import { Page, SectionHeader } from '@/components/app';
import { Button, FieldError, FieldHint, Input, Label, PendingButton, Textarea, buttonClasses } from '@/components/ui';
import { ParticipantPicker } from '@/components/tasting/ParticipantPicker';
import { SessionDateTimePicker } from '@/components/tasting/SessionDateTimePicker';
import { BackLink } from '@/components/tasting/TastingPageStates';
import { formatTimeOfDay, toOffsetDateTimeString, type TimeOfDay } from '@/components/tasting/sessionDate';
import type { User } from '@/types';

export default function NewTastingSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRecipeIds = (searchParams.get('recipe_ids') ?? '')
    .split(',')
    .map(Number)
    .filter((n) => n > 0);
  const createSession = useCreateTastingSession();
  const addRecipesToSession = useAddRecipesToSession();
  const sendInvitation = useSendTastingInvitation();

  const [name, setName] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [time, setTime] = useState<TimeOfDay>({ hour: '10', minute: '00', period: 'AM' });
  const [showCalendar, setShowCalendar] = useState(false);
  const [location, setLocation] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ name?: string; date?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { name?: string; date?: string } = {};
    if (!name.trim()) newErrors.name = 'Session name is required';
    if (!selectedDate) newErrors.date = 'Please select a date and time';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    const dateTime = toOffsetDateTimeString(selectedDate, time);

    try {
      const participantIds = selectedParticipants.map((p) => p.id);
      const session = await createSession.mutateAsync({
        name: name.trim(),
        date: dateTime,
        location: location.trim() || null,
        participant_ids: participantIds.length > 0 ? participantIds : null,
        notes: notes.trim() || null,
      });

      // Add pre-selected recipes from menu sketch
      if (preselectedRecipeIds.length > 0) {
        await addRecipesToSession.mutateAsync({
          sessionId: session.id,
          data: { recipe_ids: preselectedRecipeIds },
        });
      }

      // Send email/SMS invitations if there are participants
      if (selectedParticipants.length > 0) {
        sendInvitation.mutate({
          session_id: session.id,
          session_name: name.trim(),
          session_date: dateTime,
          formatted_date: `${format(selectedDate, 'EEEE, MMMM d, yyyy')} at ${formatTimeOfDay(time)}`,
          session_location: location.trim() || null,
          recipients: selectedParticipants.map((p) => ({
            email: p.email,
            username: p.username,
            phone_number: p.phone_number ?? null,
          })),
        });
      }

      router.push(`/tastings/${session.id}`);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const dishCount = preselectedRecipeIds.length;

  return (
    <Page>
      <div className="flex flex-col gap-4">
        <BackLink href="/rnd" label="Back to R&D" />
        <SectionHeader
          eyebrow="R&D"
          title="New tasting session"
          description="Set up a session to taste dishes and collect feedback."
        />
      </div>

      {dishCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-info-subtle px-4 py-3 text-sm text-ink">
          <FlaskConical className="size-4 shrink-0 text-info" strokeWidth={1.5} aria-hidden="true" />
          <span>
            <span className="font-medium tabular-nums">
              {dishCount} dish{dishCount !== 1 ? 'es' : ''}
            </span>{' '}
            from your menu draft will be added to this session.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex max-w-xl flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Session name</Label>
          <Input
            id="name"
            placeholder="e.g. December menu tasting"
            value={name}
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'name-error' : undefined}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
          />
          {errors.name && <FieldError id="name-error">{errors.name}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Date and time</Label>
          <SessionDateTimePicker
            id="date"
            date={selectedDate}
            time={time}
            open={showCalendar}
            onOpenChange={setShowCalendar}
            onDismiss={() => setShowCalendar(false)}
            onDateChange={(date) => {
              setSelectedDate(date);
              if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
            }}
            onTimeChange={setTime}
            invalid={!!errors.date}
            describedBy={errors.date ? 'date-error' : undefined}
            footer={
              <Button size="sm" onClick={() => setShowCalendar(false)}>
                Done
              </Button>
            }
          />
          {errors.date && <FieldError id="date-error">{errors.date}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" placeholder="e.g. Main kitchen" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="attendees">Attendees</Label>
          <ParticipantPicker inputId="attendees" selectedUsers={selectedParticipants} onChange={setSelectedParticipants} />
          <FieldHint>Attendees get an email or text invitation when you create the session.</FieldHint>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Session notes</Label>
          <Textarea
            id="notes"
            placeholder="Anything tasters should know about this session…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <PendingButton type="submit" pending={createSession.isPending}>
            Create session
          </PendingButton>
          <Link href="/rnd" className={buttonClasses('secondary', 'md')}>
            Cancel
          </Link>
        </div>
      </form>
    </Page>
  );
}
