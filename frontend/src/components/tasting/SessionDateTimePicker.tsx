'use client';

/**
 * The tasting session's date and time: a field-shaped trigger showing "3 November 2026 · 10:00 AM"
 * that opens a calendar with hour, minute and AM/PM selects underneath. The caller supplies the
 * panel's actions (`footer`) and what an outside click or Escape means (`onDismiss`).
 */
import { useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/style.css';
import { controlClasses, controlHeight } from '@/components/ui';
import { useAnchoredDismiss } from '@/components/ui/useAnchoredDismiss';
import { cn } from '@/lib/utils';
import { HOURS, MINUTES, formatTimeOfDay, type Meridiem, type TimeOfDay } from './sessionDate';

const DAY_PICKER_THEME = {
  '--rdp-accent-color': 'var(--color-brand-accent)',
  '--rdp-accent-background-color': 'var(--surface-selected)',
} as CSSProperties;

interface SessionDateTimePickerProps {
  id?: string;
  date: Date;
  time: TimeOfDay;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: TimeOfDay) => void;
  footer: ReactNode;
  invalid?: boolean;
  describedBy?: string;
}

export function SessionDateTimePicker({
  id,
  date,
  time,
  open,
  onOpenChange,
  onDismiss,
  onDateChange,
  onTimeChange,
  footer,
  invalid,
  describedBy,
}: SessionDateTimePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timeLabelId = useId();
  const { onKeyDown } = useAnchoredDismiss({
    open,
    triggerRef,
    panelRef,
    onPointerOutside: onDismiss,
    onEscape: onDismiss,
  });

  const selectClasses = cn(controlClasses, controlHeight, 'min-w-0 flex-1');

  return (
    <div className="relative" onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-describedby={describedBy}
        className={cn(controlClasses, controlHeight, 'flex w-full items-center gap-2 text-left', invalid && 'border-danger')}
      >
        <Calendar className="size-4 shrink-0 text-tertiary" strokeWidth={1.5} aria-hidden="true" />
        <span>{format(date, 'd MMMM yyyy')}</span>
        <span className="text-tertiary" aria-hidden="true">·</span>
        <Clock className="size-4 shrink-0 text-tertiary" strokeWidth={1.5} aria-hidden="true" />
        <span className="tabular-nums">{formatTimeOfDay(time)}</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Choose date and time"
          className="absolute top-full left-0 z-20 mt-1 rounded-lg border border-line bg-popover p-3 shadow-pop"
        >
          <DayPicker
            mode="single"
            selected={date}
            onSelect={(next) => next && onDateChange(next)}
            style={DAY_PICKER_THEME}
          />
          <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
            <p id={timeLabelId} className="text-[13px] font-medium text-muted-foreground">
              Time
            </p>
            <div role="group" aria-labelledby={timeLabelId} className="flex items-center gap-2">
              <select
                aria-label="Hour"
                value={time.hour}
                onChange={(e) => onTimeChange({ ...time, hour: e.target.value })}
                className={selectClasses}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <span className="text-muted-foreground" aria-hidden="true">
                :
              </span>
              <select
                aria-label="Minute"
                value={time.minute}
                onChange={(e) => onTimeChange({ ...time, minute: e.target.value })}
                className={selectClasses}
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                aria-label="AM or PM"
                value={time.period}
                onChange={(e) => onTimeChange({ ...time, period: e.target.value as Meridiem })}
                className={selectClasses}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">{footer}</div>
        </div>
      )}
    </div>
  );
}
