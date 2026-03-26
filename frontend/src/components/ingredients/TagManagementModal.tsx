'use client';

import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
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
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Tags" maxWidth="max-w-sm">
      {/* Existing tags */}
      <div className="space-y-1 mb-5 max-h-64 overflow-y-auto">
        {allTags.length === 0 && (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 py-2">No tags yet. Create one below.</p>
        )}
        {allTags.map((tag) => {
          const linked = linkedIds.has(tag.id);
          return (
            <div
              key={tag.id}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group"
            >
              <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={linked}
                  onChange={() => handleToggle(tag.id)}
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 accent-zinc-800 dark:accent-zinc-200 cursor-pointer"
                />
                <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate">{tag.name}</span>
              </label>
              {confirmDeleteId === tag.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={confirmDelete}
                    className="text-xs text-red-600 dark:text-red-400 font-medium hover:underline"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs text-zinc-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleDeleteGlobal(tag.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-opacity"
                  aria-label={`Delete tag ${tag.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Create new tag */}
      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">
          New Tag
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Tag name..."
            className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
          <button
            onClick={handleCreate}
            disabled={!newTagName.trim() || createTag.isPending}
            className="inline-flex items-center gap-1 rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {createTag.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Add
          </button>
        </div>
      </div>
    </Modal>
  );
}
