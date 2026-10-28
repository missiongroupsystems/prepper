'use client';

/**
 * A note's photos behind a disclosure, fetched only once it is opened. The grid wraps: as many
 * 112px-or-wider tiles as fit the width.
 */
import { useId, useState } from 'react';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseNoteImages } from './feedbackConfig';

export const PHOTO_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2';

export function NotePhotos({ noteId, useNoteImages }: { noteId: number; useNoteImages: UseNoteImages }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const { data: images = [], isLoading } = useNoteImages(isOpen ? noteId : null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="-ml-1 flex min-h-9 items-center gap-1 self-start rounded-md px-1 text-sm text-muted-foreground transition-colors hover:text-ink max-sm:min-h-11"
      >
        <ChevronRight className={cn('size-4 transition-transform', isOpen && 'rotate-90')} strokeWidth={1.5} aria-hidden="true" />
        Photos
      </button>
      {isOpen && (
        <div id={panelId}>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading photos…</p>
          ) : images.length > 0 ? (
            <div className={PHOTO_GRID}>
              {images.map((image) => (
                <a
                  key={image.id}
                  href={image.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square overflow-hidden rounded-md bg-surface-sunken focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Image
                    src={image.image_url}
                    alt="Tasting photo"
                    width={224}
                    height={224}
                    className="size-full object-cover transition-transform hover:scale-105"
                  />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No photos</p>
          )}
        </div>
      )}
    </div>
  );
}
