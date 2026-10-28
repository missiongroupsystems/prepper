'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCreateMenuSketchSection } from '@/lib/hooks';
import { Button, Input } from '@/components/ui';

/** Closes the editor: name a new section and add it below the last one. */
export function AddSectionInput({ sketchId, nextOrderNo }: { sketchId: number; nextOrderNo: number }) {
  const createSection = useCreateMenuSketchSection();
  const [newSectionName, setNewSectionName] = useState('');

  const handleAddSection = () => {
    const name = newSectionName.trim();
    if (!name) return;
    createSection.mutate({ menu_sketch_id: sketchId, name, order_no: nextOrderNo });
    setNewSectionName('');
  };

  return (
    <div className="flex items-center gap-2 border-t border-dashed border-line pt-6">
      <Input
        aria-label="New section name"
        value={newSectionName}
        onChange={(e) => setNewSectionName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleAddSection(); }}
        placeholder="New section name"
        className="max-w-sm"
      />
      <Button
        variant="secondary"
        onClick={handleAddSection}
        disabled={!newSectionName.trim() || createSection.isPending}
      >
        <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Add section
      </Button>
    </div>
  );
}
