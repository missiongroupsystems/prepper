'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button, Input, Label, Modal, PendingButton } from '@/components/ui';
import {
  useSupplierIngredientTags,
  useCreateSupplierIngredientTag,
  useDeleteSupplierIngredientTag,
  useTagsForSupplierIngredient,
  useAddTagToSupplierIngredient,
  useRemoveTagFromSupplierIngredient,
} from '@/lib/hooks';

interface TagManagementModalProps {
  siId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function TagManagementModal({ siId, isOpen, onClose }: TagManagementModalProps) {
  const [newTagName, setNewTagName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data: allTags = [] } = useSupplierIngredientTags();
  const { data: linkedTags = [] } = useTagsForSupplierIngredient(siId);

  const createTag = useCreateSupplierIngredientTag();
  const deleteTag = useDeleteSupplierIngredientTag();
  const addTag = useAddTagToSupplierIngredient();
  const removeTag = useRemoveTagFromSupplierIngredient();

  const linkedIds = new Set(linkedTags.map((t) => t.id));

  function handleToggle(tagId: number) {
    if (linkedIds.has(tagId)) {
      removeTag.mutate({ siId, tagId });
    } else {
      addTag.mutate({ siId, tagId });
    }
  }

  async function handleCreate() {
    const name = newTagName.trim();
    if (!name) return;
    try {
      const tag = await createTag.mutateAsync(name);
      setNewTagName('');
      addTag.mutate({ siId, tagId: tag.id });
    } catch {
      // duplicate or network error — ignore
    }
  }

  function handleDeleteGlobal(tagId: number) {
    setConfirmDeleteId(tagId);
  }

  function confirmDelete() {
    if (confirmDeleteId !== null) {
      deleteTag.mutate(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage tags" maxWidth="max-w-sm">
      {/* Existing tags */}
      <div className="space-y-1 mb-5 max-h-64 overflow-y-auto">
        {allTags.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">No tags yet. Create one below.</p>
        )}
        {allTags.map((tag) => {
          const linked = linkedIds.has(tag.id);
          return (
            <div
              key={tag.id}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary group"
            >
              <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={linked}
                  onChange={() => handleToggle(tag.id)}
                  className="size-4 cursor-pointer rounded border-input accent-accent"
                />
                <span className="text-sm text-foreground truncate">{tag.name}</span>
              </label>
              {confirmDeleteId === tag.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={confirmDelete}
                    className="text-[13px] font-medium text-danger hover:underline max-sm:min-h-10"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-[13px] text-muted-foreground hover:underline max-sm:min-h-10"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDeleteGlobal(tag.id)}
                  className="text-muted-foreground hover:text-danger"
                  aria-label={`Delete tag ${tag.name}`}
                >
                  <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Create new tag */}
      <div className="border-t border-border pt-4">
        <Label htmlFor="new-tag-name" className="mb-1.5 block">
          New tag
        </Label>
        <div className="flex gap-2">
          <Input
            id="new-tag-name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Tag name"
            className="flex-1"
          />
          <PendingButton onClick={handleCreate} disabled={!newTagName.trim()} pending={createTag.isPending}>
            <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Add
          </PendingButton>
        </div>
      </div>
    </Modal>
  );
}
