'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { FieldHint, Label, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { PHOTO_GRID } from './NotePhotos';
import type { NoteImage } from './feedbackConfig';

export interface ImageWithId {
  id: number | null;
  data: string; // base64 string
  image_url?: string; // for existing images
  removed?: boolean; // marked for deletion but not yet deleted
}

interface ImageUploadPreviewProps {
  onImagesSelected: (images: ImageWithId[]) => void;
  uploadedImages?: NoteImage[];
  isLoading?: boolean;
}

export function ImageUploadPreview({
  onImagesSelected,
  uploadedImages = [],
  isLoading = false,
}: ImageUploadPreviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [selectedImages, setSelectedImages] = useState<ImageWithId[]>(() =>
    uploadedImages.map((img) => ({
      id: img.id,
      data: '',
      image_url: img.image_url,
      removed: false,
    }))
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Update selectedImages when uploadedImages prop changes (e.g., after query loads)
  useEffect(() => {
    setSelectedImages((prevImages) => {
      const newUploadedImages = uploadedImages.map((img) => ({
        id: img.id,
        data: '',
        image_url: img.image_url,
        removed: false,
      }));

      // Keep any new images (id: null) that were added
      const newImagesFromUser = prevImages.filter((img) => img.id === null);

      return [...newUploadedImages, ...newImagesFromUser];
    });
  }, [uploadedImages]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFiles = async (files: FileList) => {
    setIsProcessing(true);
    try {
      const newBase64Images: ImageWithId[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > MAX_FILE_SIZE) {
          toast.error(`"${file.name}" is over 5 MB and was skipped.`);
          continue;
        }
        const reader = new FileReader();

        await new Promise<void>((resolve) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            // Remove the data:image/...;base64, prefix
            const base64Data = base64.split(',')[1];
            newBase64Images.push({
              id: null,
              data: base64Data,
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }

      const updated = [...selectedImages, ...newBase64Images];
      setSelectedImages(updated);
      onImagesSelected(updated);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files) await handleFiles(e.currentTarget.files);
  };

  const handleRemoveSelected = (index: number) => {
    const newSelected = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newSelected);
    onImagesSelected(newSelected);
  };

  const handleRemoveUploaded = (imageId: number) => {
    // Mark as removed locally; the parent deletes it when the note is saved.
    // Will be deleted when user saves
    const updated = selectedImages.map((img) =>
      img.id === imageId ? { ...img, removed: true } : img
    );
    setSelectedImages(updated);
    onImagesSelected(updated);
  };

  const newImages = selectedImages.filter((img) => img.id === null);
  const keptImages = selectedImages.filter((img) => img.id !== null && !img.removed);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={inputId}>Photos</Label>
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="sr-only"
          disabled={isProcessing || isLoading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || isLoading}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={async (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files.length) await handleFiles(e.dataTransfer.files); }}
          className={cn(
            'flex w-full flex-col items-center gap-2 rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground transition-colors hover:border-hairline-strong disabled:cursor-not-allowed disabled:opacity-50',
            isDragging ? 'border-info bg-info-subtle' : 'border-line'
          )}
        >
          {isProcessing ? <Spinner className="size-5" /> : <Upload className="size-5" strokeWidth={1.5} aria-hidden="true" />}
          {isProcessing ? 'Processing photos…' : 'Choose photos or drop them here'}
        </button>
        <FieldHint>Up to 5 MB each.</FieldHint>
      </div>

      {newImages.length > 0 && (
        <PhotoGroup title={`New photos (${newImages.length})`}>
          {selectedImages.map(
            (image, index) =>
              image.id === null && (
                <PhotoTile
                  key={`new-${index}`}
                  src={`data:image/png;base64,${image.data}`}
                  alt={`New photo ${index + 1}`}
                  onRemove={() => handleRemoveSelected(index)}
                  disabled={isLoading}
                />
              )
          )}
        </PhotoGroup>
      )}

      {keptImages.length > 0 && (
        <PhotoGroup title={`Saved photos (${keptImages.length})`}>
          {keptImages.map((image) => (
            <PhotoTile
              key={image.id}
              src={image.image_url ?? ''}
              alt="Saved photo"
              onRemove={() => handleRemoveUploaded(image.id as number)}
            />
          ))}
        </PhotoGroup>
      )}
    </div>
  );
}

function PhotoGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-medium text-muted-foreground tabular-nums">{title}</p>
      <div className={PHOTO_GRID}>{children}</div>
    </div>
  );
}

function PhotoTile({ src, alt, onRemove, disabled }: { src: string; alt: string; onRemove: () => void; disabled?: boolean }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-md bg-surface-sunken">
      <img src={src} alt={alt} className="size-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${alt.toLowerCase()}`}
        className="absolute top-1 right-1 flex size-8 items-center justify-center rounded-full bg-card/90 text-ink shadow-pop transition-colors hover:bg-card max-sm:size-10"
      >
        <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
}
