'use client';

import { useState } from 'react';
import { Pencil, Check, Trash2, SendHorizonal } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/ui';
import type { SketchSection, SketchComment, SketchComments } from '@/types';

interface CommentsPanelProps {
  sections: SketchSection[];
  comments: SketchComments;
  onChange: (comments: SketchComments) => void;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  );
}

export function CommentsPanel({ sections, comments, onChange }: CommentsPanelProps) {
  const [showResolved, setShowResolved] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingComment, setDeletingComment] = useState<{
    dishId: string;
    commentId: string;
  } | null>(null);
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});

  const addComment = (dishId: string) => {
    const text = (newCommentText[dishId] ?? '').trim();
    if (!text) return;
    const comment: SketchComment = {
      id: crypto.randomUUID(),
      text,
      resolved: false,
      created_at: new Date().toISOString(),
    };
    const prev = comments[dishId] ?? [];
    onChange({ ...comments, [dishId]: [...prev, comment] });
    setNewCommentText((m) => ({ ...m, [dishId]: '' }));
  };

  const resolveComment = (dishId: string, commentId: string) => {
    const updated = (comments[dishId] ?? []).map((c) =>
      c.id === commentId ? { ...c, resolved: true } : c,
    );
    onChange({ ...comments, [dishId]: updated });
    toast.success('Comment resolved');
  };

  const startEdit = (comment: SketchComment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const saveEdit = (dishId: string, commentId: string) => {
    const text = editText.trim();
    if (!text) return;
    const updated = (comments[dishId] ?? []).map((c) =>
      c.id === commentId ? { ...c, text } : c,
    );
    onChange({ ...comments, [dishId]: updated });
    setEditingId(null);
  };

  const deleteComment = (dishId: string, commentId: string) => {
    const updated = (comments[dishId] ?? []).filter((c) => c.id !== commentId);
    const next = { ...comments };
    if (updated.length === 0) {
      delete next[dishId];
    } else {
      next[dishId] = updated;
    }
    onChange(next);
    setDeletingComment(null);
    toast.success('Comment deleted');
  };

  const allDishes = sections.flatMap((s) =>
    s.dishes
      .filter((d) => d.id)
      .map((d) => ({ sectionName: s.name, dish: d })),
  );

  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      {/* Header + Show resolved */}
      <div className="shrink-0 border-b border-border px-4 py-3 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Comments</h3>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border accent-primary"
          />
          <span className="text-xs text-muted-foreground">Show resolved</span>
        </label>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {allDishes.length === 0 && (
          <p className="pt-6 text-center text-xs text-muted-foreground">
            No dishes yet.
          </p>
        )}

        {allDishes.map(({ dish }) => {
          const dishId = dish.id!;
          const allDishComments = comments[dishId] ?? [];
          const visible = showResolved
            ? allDishComments
            : allDishComments.filter((c) => !c.resolved);

          return (
            <div key={dishId} className="space-y-1.5">
              {/* Dish heading */}
              <p className="truncate text-xs font-semibold text-foreground">
                {dish.name || 'Unnamed dish'}
              </p>

              {/* Comment list */}
              {visible.map((comment) => (
                <div
                  key={comment.id}
                  className={`rounded-md border border-border bg-background p-2 space-y-1.5 ${
                    comment.resolved ? 'opacity-50' : ''
                  }`}
                >
                  {editingId === comment.id ? (
                    <div className="space-y-1.5">
                      <textarea
                        autoFocus
                        rows={2}
                        className="w-full resize-none rounded border border-border bg-muted px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            saveEdit(dishId, comment.id);
                          }
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(dishId, comment.id)}
                          className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs leading-relaxed text-foreground">
                        {comment.text}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {formatTimestamp(comment.created_at)}
                        </span>
                        {comment.resolved ? (
                          <span className="text-[10px] italic text-muted-foreground">
                            resolved
                          </span>
                        ) : (
                          <div className="flex items-center gap-0.5">
                            <button
                              title="Edit"
                              onClick={() => startEdit(comment)}
                              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              title="Resolve"
                              onClick={() => resolveComment(dishId, comment.id)}
                              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              title="Delete"
                              onClick={() =>
                                setDeletingComment({ dishId, commentId: comment.id })
                              }
                              className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add comment form */}
              <div className="relative">
                <textarea
                  rows={1}
                  placeholder="Add a comment…"
                  value={newCommentText[dishId] ?? ''}
                  onChange={(e) =>
                    setNewCommentText((m) => ({ ...m, [dishId]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addComment(dishId);
                    }
                  }}
                  className="w-full resize-none rounded-md border border-border bg-muted px-2 py-1.5 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="button"
                  title="Send"
                  onClick={() => addComment(dishId)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <SendHorizonal className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deletingComment !== null}
        onClose={() => setDeletingComment(null)}
        onConfirm={() => {
          if (deletingComment) {
            deleteComment(deletingComment.dishId, deletingComment.commentId);
          }
        }}
        title="Delete comment"
        message="Are you sure you want to delete this comment? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
