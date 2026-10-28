'use client';

/**
 * Generates (or regenerates) a recipe's AI feedback summary: the agent writes it, the recipe
 * stores it, and the R&D board refetches so the card shows it.
 */
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSummarizeFeedback } from '@/lib/hooks/useAgents';
import { updateRecipe } from '@/lib/api';

export function useFeedbackSummary(recipeId: number) {
  const queryClient = useQueryClient();
  const summarize = useSummarizeFeedback();

  /** Resolves true when a new summary was stored. Failures toast `failureMessage`. */
  const generate = async (failureMessage: string): Promise<boolean> => {
    try {
      const result = await summarize.mutateAsync(recipeId);
      if (!result.success || !result.summary) {
        toast.error(failureMessage);
        return false;
      }
      await updateRecipe(recipeId, { summary_feedback: result.summary });
      await queryClient.refetchQueries({ queryKey: ['recipes-with-feedback'] });
      return true;
    } catch {
      toast.error(failureMessage);
      return false;
    }
  };

  return { generate, isPending: summarize.isPending };
}
