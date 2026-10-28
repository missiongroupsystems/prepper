'use client';

/**
 * The Overview's first card: the hero image and the recipe's facts as labelled fields. The name
 * edits in place and saves on Enter or blur — no Save button.
 */
import { useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRecipes, useRecipeAllergens, useUpdateRecipe } from '@/lib/hooks';
import { useUser } from '@/lib/hooks/useUsers';
import { Badge, Button, EditableCell, Modal } from '@/components/ui';
import { RecipeImageCarousel } from '@/components/recipe/RecipeImageCarousel';
import type { Recipe } from '@/types';
import { Fact, OverviewSection } from './OverviewSection';

const IMAGE_SIZE = 128;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function RecipeImage({ recipe, canEdit, ingredientNames }: { recipe: Recipe; canEdit: boolean; ingredientNames: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex shrink-0 flex-col items-start gap-2">
      {recipe.image_url ? (
        <Image
          src={recipe.image_url}
          alt={recipe.name}
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          className="size-24 rounded-lg object-cover md:size-32"
        />
      ) : (
        <div className="flex size-24 items-center justify-center rounded-lg bg-surface-sunken text-placeholder md:size-32">
          <ImagePlus className="size-8" strokeWidth={1.5} aria-hidden="true" />
        </div>
      )}
      {canEdit && (
        <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
          <Wand2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Images
        </Button>
      )}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Recipe images" maxWidth="max-w-lg" maxHeight="max-h-[70vh]">
        <RecipeImageCarousel recipeId={recipe.id} recipeName={recipe.name} ingredients={ingredientNames} />
      </Modal>
    </div>
  );
}

export function OverviewDetails({
  recipe,
  canEdit,
  ingredientNames,
}: {
  recipe: Recipe;
  canEdit: boolean;
  ingredientNames: string[];
}) {
  const { mutate: updateRecipe } = useUpdateRecipe();
  const { data: allRecipesData } = useRecipes({ page_size: 30 });
  const { data: allergens = [] } = useRecipeAllergens(recipe.id);
  const { data: owner } = useUser(recipe.owner_id);
  const { data: creator } = useUser(recipe.created_by);

  const parentName = recipe.root_id
    ? (allRecipesData?.items.find((r) => r.id === recipe.root_id)?.name ?? `Recipe #${recipe.root_id}`)
    : 'Original';

  const saveName = (value: string) => {
    const name = value.trim();
    if (!name) return;
    updateRecipe({ id: recipe.id, data: { name } }, { onError: () => toast.error('Could not rename the recipe') });
  };

  return (
    <OverviewSection title="Details">
      <div className="flex flex-col gap-6 sm:flex-row">
        <RecipeImage recipe={recipe} canEdit={canEdit} ingredientNames={ingredientNames} />
        <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
          <div className="col-span-2 md:col-span-3">
            <Fact label="Name">
              {canEdit ? (
                <EditableCell value={recipe.name} onSave={saveName} className="-mx-2 inline-block text-base" />
              ) : (
                <span className="text-base">{recipe.name}</span>
              )}
            </Fact>
          </div>
          <Fact label="Yield">
            <span className="tabular-nums">
              {recipe.yield_quantity} {recipe.yield_unit}
            </span>
          </Fact>
          <Fact label="Version">
            <span className="tabular-nums">v{recipe.version}</span>
          </Fact>
          <Fact label="Based on">{parentName}</Fact>
          <Fact label="Created">{formatDate(recipe.created_at)}</Fact>
          <Fact label="Updated">{formatDate(recipe.updated_at)}</Fact>
          {recipe.created_by && <Fact label="Created by">{creator?.username ?? '—'}</Fact>}
          {recipe.owner_id && <Fact label="Owner">{owner?.username ?? '—'}</Fact>}
          {allergens.length > 0 && (
            <div className="col-span-2 md:col-span-3">
              <Fact label="Allergens">
                <span className="flex flex-wrap gap-1.5">
                  {allergens.map((allergen) => (
                    <Badge key={allergen.id} variant="warning">
                      {allergen.name}
                    </Badge>
                  ))}
                </span>
              </Fact>
            </div>
          )}
        </dl>
      </div>
    </OverviewSection>
  );
}
