'use client';

/**
 * One ingredient as a grid card or a list row: code, name, unit price, then unit / halal /
 * tag / allergen badges and the record's menu. Edit opens the ingredient's page.
 */
import { AlertCircle } from 'lucide-react';
import { Badge, EntityCode } from '@/components/ui';
import { RecordCard, RecordRow } from '@/components/lists/RecordCard';
import { RowActions } from '@/components/lists/RowActions';
import { formatUnitPrice } from '@/lib/utils';
import { displayNameParts, formatDisplayName } from '@/lib/format/displayName';
import { useAllergensByIngredient, useAllergens } from '@/lib/hooks';
import type { Ingredient, Category } from '@/types';

export interface IngredientItemProps {
  ingredient: Ingredient;
  categories?: Category[];
  onEdit?: (ingredient: Ingredient) => void;
  onArchive?: (ingredient: Ingredient) => void;
  onUnarchive?: (ingredient: Ingredient) => void;
}

function useIngredientParts({ ingredient, categories, onEdit, onArchive, onUnarchive }: IngredientItemProps) {
  // One allergen-link request per ingredient (an N+1 across the page) until the list endpoint returns them.
  const { data: allergenLinks } = useAllergensByIngredient(ingredient.id);
  const { data: allergens } = useAllergens();

  const { code, name } = displayNameParts(ingredient.name);
  const href = `/ingredients/${ingredient.id}`;
  const category = categories?.find((c) => c.id === ingredient.category_id);
  const ingredientAllergens = allergenLinks?.length
    ? (allergens ?? []).filter((a) => allergenLinks.some((link) => link.allergen_id === a.id))
    : [];

  return {
    title: name,
    eyebrow: code ? <EntityCode>{code}</EntityCode> : undefined,
    subtitle: <span className="tabular-nums">{formatUnitPrice(ingredient.cost_per_base_unit, ingredient.base_unit)}</span>,
    href,
    badges: (
      <>
        <Badge>{ingredient.base_unit}</Badge>
        <Badge variant={ingredient.is_halal ? 'success' : 'neutral'}>{ingredient.is_halal ? 'Halal' : 'Non-halal'}</Badge>
        {!ingredient.is_active && <Badge variant="warning">Archived</Badge>}
        {category && <Badge className="max-w-full whitespace-normal">{formatDisplayName(category.name)}</Badge>}
        {ingredientAllergens.map((allergen) => (
          <Badge key={allergen.id} variant="danger" className="gap-1">
            <AlertCircle className="size-3" strokeWidth={1.5} aria-hidden="true" />
            {allergen.name}
          </Badge>
        ))}
      </>
    ),
    actions: (
      <RowActions
        item={ingredient}
        name={name}
        isActive={ingredient.is_active}
        onEdit={onEdit}
        editHref={onEdit ? undefined : href}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
      />
    ),
  };
}

export function IngredientCard(props: IngredientItemProps) {
  return <RecordCard {...useIngredientParts(props)} />;
}

export function IngredientListRow(props: IngredientItemProps) {
  return <RecordRow {...useIngredientParts(props)} />;
}
