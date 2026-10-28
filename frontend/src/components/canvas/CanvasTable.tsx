'use client';

/**
 * Table view of the staged items. The item column is a searchable picker over ingredients and
 * recipes: picking another ingredient swaps the row (merging into a row that already has it), and
 * picking across kinds moves the row between ingredients and sub-recipes.
 */
import { Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { displayNameParts, formatDisplayName } from '@/lib/format/displayName';
import type { Ingredient, Recipe } from '@/types';
import { LineCost, QuantityStepper, RowActions, UnitSelect, WastageInput } from './StagedControls';
import type { StagedIngredient, StagedItemActions, StagedRecipe } from './types';
import { itemLabel } from './canvasModel';

const INGREDIENT_VALUE_PREFIX = 'ing:';
const RECIPE_VALUE_PREFIX = 'rec:';

function ItemPicker({
  value,
  itemName,
  allIngredients,
  allRecipes,
  categoryMap,
  onPick,
}: {
  value: string;
  itemName: string;
  allIngredients?: Ingredient[];
  allRecipes?: Recipe[];
  categoryMap: Record<number, string>;
  onPick: (picked: Ingredient | Recipe) => void;
}) {
  const isLoaded = value.startsWith(INGREDIENT_VALUE_PREFIX)
    ? !!allIngredients?.some((i) => `${INGREDIENT_VALUE_PREFIX}${i.id}` === value)
    : !!allRecipes?.some((r) => `${RECIPE_VALUE_PREFIX}${r.id}` === value);

  const handleChange = (next: string) => {
    if (next.startsWith(INGREDIENT_VALUE_PREFIX)) {
      const id = Number(next.slice(INGREDIENT_VALUE_PREFIX.length));
      const ingredient = allIngredients?.find((i) => i.id === id);
      if (ingredient) onPick(ingredient);
      return;
    }
    const id = Number(next.slice(RECIPE_VALUE_PREFIX.length));
    const recipe = allRecipes?.find((r) => r.id === id);
    if (recipe) onPick(recipe);
  };

  return (
    <Select
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      aria-label={`Item for ${itemName}`}
      searchable
      className="w-full min-w-40"
    >
      {/* The row's own item stays pickable when it is outside the loaded page. */}
      {!isLoaded && <option value={value}>{itemName}</option>}
      <optgroup label="Ingredients">
        {allIngredients?.map((ing) => {
          const category = ing.category_id ? categoryMap[ing.category_id] : null;
          const parts = displayNameParts(ing.name);
          return (
            <option
              key={`ing-${ing.id}`}
              value={`${INGREDIENT_VALUE_PREFIX}${ing.id}`}
              title={[parts.code, category, ing.base_unit].filter(Boolean).join(' · ')}
            >
              {parts.name}
            </option>
          );
        })}
      </optgroup>
      <optgroup label="Recipes">
        {allRecipes?.map((recipe) => (
          <option
            key={`rec-${recipe.id}`}
            value={`${RECIPE_VALUE_PREFIX}${recipe.id}`}
            title={`Yield ${recipe.yield_quantity} ${recipe.yield_unit}`}
          >
            {formatDisplayName(recipe.name)}
          </option>
        ))}
      </optgroup>
    </Select>
  );
}

export function CanvasTable({
  stagedIngredients,
  stagedRecipes,
  actions,
  allIngredients,
  allRecipes,
  categoryMap,
}: {
  stagedIngredients: StagedIngredient[];
  stagedRecipes: StagedRecipe[];
  actions: StagedItemActions;
  allIngredients?: Ingredient[];
  allRecipes?: Recipe[];
  categoryMap: Record<number, string>;
}) {
  return (
    <Table framed density="compact">
      <TableHeader>
        <TableRow>
          <TableHead>Qty</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Wastage</TableHead>
          <TableHead>Item</TableHead>
          <TableHead numeric>Cost</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stagedIngredients.map((staged) => {
          const name = itemLabel(staged.ingredient.name);
          return (
            <TableRow key={staged.id}>
              <TableCell>
                <QuantityStepper
                  value={staged.quantity}
                  onChange={(v) => actions.onIngredientQuantityChange(staged.id, v)}
                  itemName={name}
                  inputClassName="w-16"
                />
              </TableCell>
              <TableCell>
                <UnitSelect
                  unit={staged.unit}
                  onChange={(u) => actions.onIngredientUnitChange(staged.id, u)}
                  itemName={name}
                  className="w-20"
                />
              </TableCell>
              <TableCell>
                <WastageInput
                  value={staged.wastage_percentage}
                  onChange={(w) => actions.onIngredientWastageChange(staged.id, w)}
                  itemName={name}
                />
              </TableCell>
              <TableCell>
                <ItemPicker
                  value={`${INGREDIENT_VALUE_PREFIX}${staged.ingredient.id}`}
                  itemName={name}
                  allIngredients={allIngredients}
                  allRecipes={allRecipes}
                  categoryMap={categoryMap}
                  onPick={(picked) => actions.onIngredientSelect(staged.id, picked)}
                />
              </TableCell>
              <TableCell numeric>
                <LineCost quantity={staged.quantity} unitPrice={staged.unitPrice} unit={staged.unit} stacked />
              </TableCell>
              <TableCell>
                <RowActions itemName={name} onRemove={() => actions.onRemoveIngredient(staged.id)} />
              </TableCell>
            </TableRow>
          );
        })}
        {stagedRecipes.map((staged) => {
          const name = itemLabel(staged.recipe.name);
          return (
            <TableRow key={staged.id}>
              <TableCell>
                <QuantityStepper
                  value={staged.quantity}
                  onChange={(v) => actions.onRecipeQuantityChange(staged.id, v)}
                  itemName={name}
                  inputClassName="w-16"
                />
              </TableCell>
              <TableCell className="text-muted-foreground">portion</TableCell>
              <TableCell className="text-muted-foreground">—</TableCell>
              <TableCell>
                <ItemPicker
                  value={`${RECIPE_VALUE_PREFIX}${staged.recipe.id}`}
                  itemName={name}
                  allIngredients={allIngredients}
                  allRecipes={allRecipes}
                  categoryMap={categoryMap}
                  onPick={(picked) => actions.onRecipeSelect(staged.id, picked)}
                />
              </TableCell>
              <TableCell numeric className="text-muted-foreground">
                —
              </TableCell>
              <TableCell>
                <RowActions itemName={name} onRemove={() => actions.onRemoveRecipe(staged.id)} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
