/** A read-only view of the method: numbered steps with timers and temperatures, or the raw text. */
import { Clock, Thermometer } from 'lucide-react';
import { formatTimer } from '@/lib/utils';
import type { Recipe } from '@/types';
import { OverviewSection } from './OverviewSection';

const ICON = { className: 'size-4', strokeWidth: 1.5, 'aria-hidden': 'true' } as const;

export function OverviewInstructions({ recipe }: { recipe: Recipe }) {
  const steps = recipe.instructions_structured?.steps ?? [];

  return (
    <OverviewSection title="Instructions">
      {steps.length > 0 ? (
        <ol className="flex flex-col gap-4">
          {steps.map((step, index) => (
            <li key={index} className="flex gap-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-sm font-medium tabular-nums text-muted-foreground">
                {step.order || index + 1}
              </span>
              <div className="flex flex-1 flex-col gap-2 pt-0.5">
                <p className="text-sm text-ink">{step.text}</p>
                {(step.timer_seconds || step.temperature_c) && (
                  <div className="flex items-center gap-4 text-sm tabular-nums text-muted-foreground">
                    {step.timer_seconds && (
                      <span className="flex items-center gap-1">
                        <Clock {...ICON} />
                        {formatTimer(step.timer_seconds)}
                      </span>
                    )}
                    {step.temperature_c && (
                      <span className="flex items-center gap-1">
                        <Thermometer {...ICON} />
                        {step.temperature_c}°C
                      </span>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : recipe.instructions_raw ? (
        <p className="text-sm whitespace-pre-wrap text-ink">{recipe.instructions_raw}</p>
      ) : (
        <p className="text-sm text-tertiary">No instructions yet</p>
      )}
    </OverviewSection>
  );
}
