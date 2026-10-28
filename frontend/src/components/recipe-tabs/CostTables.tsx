/**
 * The two cost breakdown tables on the Costs tab — base ingredients and sub-recipes. Money and
 * quantities are right-aligned tabular figures; each table ends in a subtotal row.
 */
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { cn, formatCurrency, formatUnitPrice } from '@/lib/utils';
import type { Recipe, CostingResult, SubRecipeCostItem } from '@/types';
import { IngredientName } from './IngredientName';

const DEFAULT_YIELD_UNIT = 'portion';

export function IngredientCostTable({ costing }: { costing: CostingResult }) {
  const columns = 5;
  return (
    <Table framed aria-label="Ingredient costs">
      <TableHeader>
        <TableRow>
          <TableHead>Ingredient</TableHead>
          <TableHead numeric>Quantity</TableHead>
          <TableHead numeric>Unit cost</TableHead>
          <TableHead numeric>Wastage</TableHead>
          <TableHead numeric>Line cost</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {costing.breakdown.length === 0 && <TableEmpty colSpan={columns}>No base ingredients</TableEmpty>}
        {costing.breakdown.map((item) => (
          <TableRow key={item.ingredient_id}>
            <TableCell>
              <IngredientName name={item.ingredient_name} />
            </TableCell>
            <TableCell numeric className="text-muted-foreground">
              {item.quantity} {item.unit}
            </TableCell>
            <TableCell numeric className="text-muted-foreground">
              {item.cost_per_base_unit != null ? formatUnitPrice(item.cost_per_base_unit, item.base_unit) : '—'}
            </TableCell>
            <TableCell
              numeric
              className={cn(item.wastage_percentage > 0 ? 'font-medium text-warning' : 'text-muted-foreground')}
            >
              {item.wastage_percentage > 0 ? `${item.wastage_percentage.toFixed(1)}%` : '—'}
            </TableCell>
            <TableCell numeric className="font-medium">
              {formatCurrency(item.line_cost)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      {costing.ingredient_cost != null && costing.breakdown.length > 0 && (
        <SubtotalRow span={columns - 1} value={costing.ingredient_cost} />
      )}
    </Table>
  );
}

/** Cost of one unit of a sub-recipe, in the unit the parent actually uses it in. */
function subRecipeUnitCost(item: SubRecipeCostItem): number | null {
  if (item.unit === 'portion') return item.sub_recipe_portion_cost;
  if (item.unit === 'batch') return item.sub_recipe_batch_cost;
  if (item.unit === 'g' || item.unit === 'ml') {
    return item.line_cost != null && item.quantity > 0 ? item.line_cost / item.quantity : null;
  }
  return null;
}

export function SubRecipeCostTable({
  costing,
  recipesById,
}: {
  costing: CostingResult;
  recipesById: Map<number, Recipe>;
}) {
  const columns = 4;
  return (
    <Table framed aria-label="Sub-recipe costs">
      <TableHeader>
        <TableRow>
          <TableHead>Sub-recipe</TableHead>
          <TableHead numeric>Quantity</TableHead>
          <TableHead numeric>Unit cost</TableHead>
          <TableHead numeric>Line cost</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {costing.sub_recipe_breakdown.length === 0 && <TableEmpty colSpan={columns}>No sub-recipes</TableEmpty>}
        {costing.sub_recipe_breakdown.map((item) => {
          const child = recipesById.get(item.recipe_id);
          const childYield = child?.yield_quantity ?? 1;
          const childYieldUnit = child?.yield_unit ?? DEFAULT_YIELD_UNIT;
          const unitCost = subRecipeUnitCost(item);
          return (
            <TableRow key={item.link_id}>
              <TableCell>{item.recipe_name}</TableCell>
              <TableCell numeric className="text-muted-foreground">
                {item.quantity} {item.unit}
                {item.unit === 'portion' && childYield > 1 && (
                  <span className="block text-xs text-warning">
                    {item.quantity} of {childYield} {childYieldUnit}s
                  </span>
                )}
              </TableCell>
              <TableCell numeric className="text-muted-foreground">
                {unitCost != null
                  ? formatUnitPrice(unitCost, item.unit === 'portion' ? childYieldUnit : item.unit)
                  : '—'}
              </TableCell>
              <TableCell numeric className="font-medium">
                {formatCurrency(item.line_cost)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      {costing.sub_recipe_cost != null && costing.sub_recipe_breakdown.length > 0 && (
        <SubtotalRow span={columns - 1} value={costing.sub_recipe_cost} />
      )}
    </Table>
  );
}

function SubtotalRow({ span, value }: { span: number; value: number }) {
  return (
    <TableFooter>
      <TableRow>
        <TableCell colSpan={span} className="text-right text-muted-foreground">
          Subtotal
        </TableCell>
        <TableCell numeric className="font-medium">
          {formatCurrency(value)}
        </TableCell>
      </TableRow>
    </TableFooter>
  );
}
