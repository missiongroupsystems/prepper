'use client';

import { cn } from '@/lib/utils';
import { formatDisplayName } from '@/lib/format/displayName';
import type { Category, Allergen } from '@/types';

const UNIT_OPTIONS = [
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'l', label: 'l' },
  { value: 'pcs', label: 'pcs' },
];

/** One pill per display label: `DAIRY` and `Dairy` read the same, so they filter together. */
interface CategoryPill {
  label: string;
  ids: number[];
}

function toCategoryPills(categories: Category[]): CategoryPill[] {
  const pills = new Map<string, CategoryPill>();
  for (const category of categories) {
    const label = formatDisplayName(category.name);
    const key = label.toLowerCase();
    const pill = pills.get(key);
    if (pill) pill.ids.push(category.id);
    else pills.set(key, { label, ids: [category.id] });
  }
  return [...pills.values()];
}

interface FilterButtonsProps {
  categories: Category[] | undefined;
  hasMoreCategories?: boolean;
  onLoadMoreCategories?: () => void;
  isLoadingMoreCategories?: boolean;
  selectedCategories: number[];
  onCategoryChange: (categoryIds: number[]) => void;
  selectedUnits: string[];
  onUnitChange: (units: string[]) => void;
  selectedHalal: boolean[];
  onHalalChange: (halal: boolean[]) => void;
  allergens: Allergen[] | undefined;
  selectedAllergens: number[];
  onAllergenChange: (allergenIds: number[]) => void;
  hasSearch?: boolean;
}

export function FilterButtons({
  categories,
  hasMoreCategories,
  onLoadMoreCategories,
  isLoadingMoreCategories,
  selectedCategories,
  onCategoryChange,
  selectedUnits,
  onUnitChange,
  selectedHalal,
  onHalalChange,
  allergens,
  selectedAllergens,
  onAllergenChange,
  hasSearch = false,
}: FilterButtonsProps) {
  const isPillSelected = (pill: CategoryPill) => pill.ids.some((id) => selectedCategories.includes(id));

  const toggleCategoryPill = (pill: CategoryPill) => {
    const others = selectedCategories.filter((id) => !pill.ids.includes(id));
    onCategoryChange(isPillSelected(pill) ? others : [...others, ...pill.ids]);
  };

  const toggleUnit = (unit: string) => {
    if (selectedUnits.includes(unit)) {
      onUnitChange(selectedUnits.filter((u) => u !== unit));
    } else {
      onUnitChange([...selectedUnits, unit]);
    }
  };

  const toggleHalal = (isHalal: boolean) => {
    if (selectedHalal.includes(isHalal)) {
      onHalalChange(selectedHalal.filter((h) => h !== isHalal));
    } else {
      onHalalChange([...selectedHalal, isHalal]);
    }
  };

  const toggleAllergen = (allergenId: number) => {
    if (selectedAllergens.includes(allergenId)) {
      onAllergenChange(selectedAllergens.filter((id) => id !== allergenId));
    } else {
      onAllergenChange([...selectedAllergens, allergenId]);
    }
  };

  const categoryPills = toCategoryPills(categories?.filter((c) => c.is_active) ?? []);
  const activeAllergens = allergens?.filter((a) => a.is_active) ?? [];

  return (
    <div className="flex flex-col gap-3">
      {/* Category Filters */}
      {categoryPills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">
            {hasSearch ? 'Matching tags:' : 'Category:'}
          </span>
          {categoryPills.map((pill) => (
            <button
              key={pill.ids[0]}
              onClick={() => toggleCategoryPill(pill)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                isPillSelected(pill)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-muted'
              )}
            >
              {pill.label}
            </button>
          ))}
          {hasMoreCategories && (
            <button
              onClick={onLoadMoreCategories}
              disabled={isLoadingMoreCategories}
              className="px-3 py-1 text-xs font-medium rounded-full text-muted-foreground hover:text-foreground underline transition-colors disabled:opacity-50"
            >
              {isLoadingMoreCategories ? 'Loading...' : 'See more'}
            </button>
          )}
        </div>
      )}

      {/* Unit Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">
          Unit:
        </span>
        {UNIT_OPTIONS.map((unit) => (
          <button
            key={unit.value}
            onClick={() => toggleUnit(unit.value)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-colors',
              selectedUnits.includes(unit.value)
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            )}
          >
            {unit.label}
          </button>
        ))}
      </div>

      {/* Halal Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">
          Halal:
        </span>
        <button
          onClick={() => toggleHalal(true)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-full transition-colors',
            selectedHalal.includes(true)
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-muted'
          )}
        >
          Halal
        </button>
        <button
          onClick={() => toggleHalal(false)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-full transition-colors',
            selectedHalal.includes(false)
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-muted'
          )}
        >
          Non-halal
        </button>
      </div>

      {/* Allergen Filters */}
      {activeAllergens.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">
            Allergens:
          </span>
          {activeAllergens.map((allergen) => (
            <button
              key={allergen.id}
              onClick={() => toggleAllergen(allergen.id)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                selectedAllergens.includes(allergen.id)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-muted'
              )}
            >
              {allergen.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
