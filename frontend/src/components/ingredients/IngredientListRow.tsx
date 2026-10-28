'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Edit2, Archive, ArchiveRestore, AlertCircle } from 'lucide-react';
import { Card, CardContent, Badge, Button, EntityCode } from '@/components/ui';
import { formatUnitPrice } from '@/lib/utils';
import { displayNameParts, formatDisplayName } from '@/lib/format/displayName';
import { useAllergensByIngredient, useAllergens } from '@/lib/hooks';
import type { Ingredient, Category } from '@/types';

interface IngredientListRowProps {
  ingredient: Ingredient;
  categories?: Category[];
  onEdit?: (ingredient: Ingredient) => void;
  onArchive?: (ingredient: Ingredient) => void;
  onUnarchive?: (ingredient: Ingredient) => void;
}

export function IngredientListRow({
  ingredient,
  categories,
  onEdit,
  onArchive,
  onUnarchive,
}: IngredientListRowProps) {
  const [showActions, setShowActions] = useState(false);
  const { data: allergenLinks } = useAllergensByIngredient(ingredient.id);
  const { data: allergens } = useAllergens();

  const { code, name } = displayNameParts(ingredient.name);
  const currentCategory = categories?.find((c) => c.id === ingredient.category_id);
  const ingredientAllergens = allergenLinks?.length
    ? allergens?.filter((a) => allergenLinks.some((link) => link.allergen_id === a.id))
    : [];

  return (
    <Card
      className="relative py-4"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardContent className="mt-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link href={`/ingredients/${ingredient.id}`} className="block">
              {code && <EntityCode>{code}</EntityCode>}
              <h3 className="text-base font-medium text-ink break-words hover:text-primary">
                {name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
              {formatUnitPrice(ingredient.cost_per_base_unit, ingredient.base_unit)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Badge variant="unit">{ingredient.base_unit}</Badge>
              {ingredient.is_halal ? (
                <Badge variant="success">Halal</Badge>
              ) : (
                <Badge variant="secondary">Non-halal</Badge>
              )}
              {!ingredient.is_active && (
                <Badge variant="warning">Archived</Badge>
              )}
              {currentCategory && (
                <Badge>{formatDisplayName(currentCategory.name)}</Badge>
              )}
              {ingredientAllergens && ingredientAllergens.length > 0 && (
                <>
                  {ingredientAllergens.map((allergen) => (
                    <Badge key={allergen.id} variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {allergen.name}
                    </Badge>
                  ))}
                </>
              )}
            </div>

            {showActions && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.preventDefault();
                      onEdit(ingredient);
                    }}
                    title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onArchive && ingredient.is_active && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.preventDefault();
                      onArchive(ingredient);
                    }}
                    title="Archive"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onUnarchive && !ingredient.is_active && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.preventDefault();
                      onUnarchive(ingredient);
                    }}
                    title="Unarchive"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
