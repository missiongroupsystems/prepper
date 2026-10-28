'use client';

/**
 * The drag ghost. Neutral by design — the accent budget (§4) spends the brand green on primary
 * action, the hero metric, active/selected state and brand chrome, so a drag ghost stays on the
 * neutral ramp. Ingredients and recipes are told apart by their label and image, not by colour.
 */
import Image from 'next/image';
import { GripVertical, ImagePlus } from 'lucide-react';
import { Badge } from '@/components/ui';
import type { DragItem, StagedIngredient, StagedRecipe } from './types';
import { itemLabel } from './canvasModel';

function DragPreviewCard({ name, meta, imageUrl }: { name: string; meta: string; imageUrl?: string | null }) {
  return (
    <div className="w-48 overflow-hidden rounded-lg bg-card shadow-pop hairline">
      <div className="relative flex h-20 items-center justify-center bg-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" />
        ) : (
          <ImagePlus className="size-7 text-placeholder" strokeWidth={1.5} aria-hidden="true" />
        )}
      </div>
      <div className="flex items-center gap-2 px-3 pt-2">
        <GripVertical className="size-4 shrink-0 text-tertiary" strokeWidth={1.5} aria-hidden="true" />
        <span className="truncate text-sm font-medium text-ink">{itemLabel(name)}</span>
      </div>
      <div className="px-3 pb-3 pt-2">
        <Badge>{meta}</Badge>
      </div>
    </div>
  );
}

export function DragPreview({
  item,
  stagedIngredients,
  stagedRecipes,
}: {
  item: DragItem;
  stagedIngredients: StagedIngredient[];
  stagedRecipes: StagedRecipe[];
}) {
  switch (item.type) {
    case 'panel-ingredient':
      return <DragPreviewCard name={item.ingredient.name} meta={item.ingredient.base_unit} />;
    case 'panel-recipe':
      return (
        <DragPreviewCard
          name={item.recipe.name}
          meta={`${item.recipe.yield_quantity} ${item.recipe.yield_unit}`}
          imageUrl={item.recipe.image_url}
        />
      );
    case 'staged-ingredient': {
      const staged = stagedIngredients.find((s) => s.id === item.stagedId);
      return staged ? <DragPreviewCard name={staged.ingredient.name} meta={staged.unit} /> : null;
    }
    case 'staged-recipe': {
      const staged = stagedRecipes.find((s) => s.id === item.stagedId);
      return staged ? (
        <DragPreviewCard
          name={staged.recipe.name}
          meta={`${staged.recipe.yield_quantity} ${staged.recipe.yield_unit}`}
          imageUrl={staged.recipe.image_url}
        />
      ) : null;
    }
  }
}
