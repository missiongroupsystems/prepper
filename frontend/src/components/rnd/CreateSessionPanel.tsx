'use client';

/**
 * Schedules a tasting session for an in-progress fork: creates the session for tomorrow, adds the
 * dish to it, and marks the fork's parent ready for review.
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAddRecipeToSession, useCreateTastingSession } from '@/lib/hooks/useTastings';
import { Button, FieldHint, Input, Label, PendingButton, SidePanel } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import { updateRecipe } from '@/lib/api';
import type { Recipe } from '@/types';

/** Lets the invalidated board queries start refetching before the panel's busy state clears. */
const REFETCH_SETTLE_MS = 100;

export function CreateSessionPanel({ recipe, open, onClose }: { recipe: Recipe; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const createSession = useCreateTastingSession();
  const addRecipeToSession = useAddRecipeToSession();
  const [sessionName, setSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const close = () => {
    onClose();
    setSessionName('');
  };

  const handleCreate = async () => {
    if (!sessionName.trim()) return;
    setIsCreating(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const session = await createSession.mutateAsync({ name: sessionName.trim(), date: tomorrow.toISOString() });
      await addRecipeToSession.mutateAsync({ sessionId: session.id, data: { recipe_id: recipe.id } });

      if (recipe.root_id) {
        try {
          await updateRecipe(recipe.root_id, { review_ready: true });
          toast.success('Parent recipe marked as ready for review');
        } catch (error) {
          console.error('Failed to mark parent recipe as review_ready:', error);
          toast.error('Failed to mark parent recipe as ready for review');
        }
      }

      close();
      toast.success('Tasting session created successfully');
      await queryClient.invalidateQueries({ queryKey: ['recipes'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['recipes-with-feedback'], exact: false });
      await new Promise((resolve) => setTimeout(resolve, REFETCH_SETTLE_MS));
    } catch (error) {
      console.error('Failed to create tasting session:', error);
      toast.error('Failed to create tasting session');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SidePanel
      open={open}
      onClose={close}
      title="New tasting session"
      description={`Schedules a tasting for tomorrow with ${formatDisplayName(recipe.name)} on the menu.`}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <PendingButton onClick={handleCreate} pending={isCreating} disabled={!sessionName.trim()}>
            Create session
          </PendingButton>
        </>
      }
    >
      <form
        className="flex flex-col gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          handleCreate();
        }}
      >
        <Label htmlFor="rnd-session-name">Session name</Label>
        <Input
          id="rnd-session-name"
          placeholder="e.g. December menu tasting"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          aria-describedby="rnd-session-name-hint"
          autoFocus
        />
        <FieldHint id="rnd-session-name-hint">You can change the date, place and attendees on the session page.</FieldHint>
      </form>
    </SidePanel>
  );
}
