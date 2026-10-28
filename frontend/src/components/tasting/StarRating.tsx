'use client';

/**
 * A five-star rating. Read-only it is an image with a "4 out of 5" name; with `onChange` it is a
 * radio group, one star per option.
 */
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const STARS = [1, 2, 3, 4, 5];

interface StarRatingProps {
  rating: number | null;
  onChange?: (value: number) => void;
  /** Names the radio group — "Overall rating". */
  label?: string;
  size?: 'sm' | 'md';
}

export function StarRating({ rating, onChange, label = 'Overall rating', size = 'md' }: StarRatingProps) {
  const icon = size === 'sm' ? 'size-3.5' : 'size-5';
  const starClass = (star: number) =>
    cn(icon, rating && star <= rating ? 'fill-ink text-ink' : 'text-placeholder');

  if (!onChange) {
    return (
      <span
        role="img"
        aria-label={rating ? `${rating} out of 5` : 'Not rated'}
        className="inline-flex items-center gap-0.5"
      >
        {STARS.map((star) => (
          <Star key={star} className={starClass(star)} strokeWidth={1.5} aria-hidden="true" />
        ))}
      </span>
    );
  }

  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-0.5">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={rating === star}
          aria-label={`${star} out of 5`}
          onClick={() => onChange(star)}
          className="flex size-9 items-center justify-center rounded-md transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-ring max-sm:size-11"
        >
          <Star className={starClass(star)} strokeWidth={1.5} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
