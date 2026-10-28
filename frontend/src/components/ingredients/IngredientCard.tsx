'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Edit2, Archive, ArchiveRestore, AlertCircle } from 'lucide-react';
import { Card, CardTitle, CardContent, Badge, Button, EntityCode } from '@/components/ui';
import { formatUnitPrice } from '@/lib/utils';
import { displayNameParts, formatDisplayName } from '@/lib/format/displayName';
import { useAllergensByIngredient, useAllergens } from '@/lib/hooks';
import type { Ingredient, Category } from '@/types';

interface IngredientCardProps {
  ingredient: Ingredient;
  categories?: Category[];
  onEdit?: (ingredient: Ingredient) => void;
  onArchive?: (ingredient: Ingredient) => void;
  onUnarchive?: (ingredient: Ingredient) => void;
}

export function IngredientCard({ ingredient, categories, onEdit, onArchive, onUnarchive }: IngredientCardProps) {
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
      className="relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Link href={`/ingredients/${ingredient.id}`} className="block min-w-0">
        {code && <EntityCode className="mb-1">{code}</EntityCode>}
        <CardTitle className="break-words hover:text-primary">{name}</CardTitle>
      </Link>
      <p className="mt-1 text-sm text-muted-foreground tabular-nums">
        {formatUnitPrice(ingredient.cost_per_base_unit, ingredient.base_unit)}
      </p>

      <CardContent>
        <div className="flex items-center gap-2 flex-wrap">
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
            <Badge className="max-w-full whitespace-normal">{formatDisplayName(currentCategory.name)}</Badge>
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
      </CardContent>

      {/* Quick Actions */}
      {showActions && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-card rounded-lg shadow-elevation-2 border border-border p-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(ingredient)}
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
              onClick={() => onArchive(ingredient)}
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
              onClick={() => onUnarchive(ingredient)}
              title="Unarchive"
            >
              <ArchiveRestore className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
