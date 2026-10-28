'use client';

import type { ReactNode } from 'react';
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
      {categoryPills.length > 0 && (
        <FilterGroup label={hasSearch ? 'Matching tags' : 'Tag'}>
          {categoryPills.map((pill) => (
            <FilterPill key={pill.ids[0]} pressed={isPillSelected(pill)} onClick={() => toggleCategoryPill(pill)}>
              {pill.label}
            </FilterPill>
          ))}
          {hasMoreCategories && (
            <button
              type="button"
              onClick={onLoadMoreCategories}
              disabled={isLoadingMoreCategories}
              className="rounded-full px-2 py-1 text-[13px] text-muted-foreground underline underline-offset-2 hover:text-ink disabled:opacity-50 max-sm:min-h-10"
            >
              {isLoadingMoreCategories ? 'Loading…' : 'See more'}
            </button>
          )}
        </FilterGroup>
      )}

      <FilterGroup label="Unit">
        {UNIT_OPTIONS.map((unit) => (
          <FilterPill key={unit.value} pressed={selectedUnits.includes(unit.value)} onClick={() => toggleUnit(unit.value)}>
            {unit.label}
          </FilterPill>
        ))}
      </FilterGroup>

      <FilterGroup label="Halal">
        <FilterPill pressed={selectedHalal.includes(true)} onClick={() => toggleHalal(true)}>
          Halal
        </FilterPill>
        <FilterPill pressed={selectedHalal.includes(false)} onClick={() => toggleHalal(false)}>
          Non-halal
        </FilterPill>
      </FilterGroup>

      {activeAllergens.length > 0 && (
        <FilterGroup label="Allergens">
          {activeAllergens.map((allergen) => (
            <FilterPill
              key={allergen.id}
              pressed={selectedAllergens.includes(allergen.id)}
              onClick={() => toggleAllergen(allergen.id)}
            >
              {allergen.name}
            </FilterPill>
          ))}
        </FilterGroup>
      )}
    </div>
  );
}

/** A labelled row of pills: the label sits in its own column from `sm`, above the pills on a phone. */
function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
      <span className="shrink-0 text-[13px] font-medium text-muted-foreground sm:w-28 sm:pt-1.5">{label}</span>
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function FilterPill({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-[13px] font-medium transition-colors duration-(--dur-quick) max-sm:min-h-10',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        pressed ? 'bg-accent text-accent-foreground' : 'bg-surface-sunken text-ink hairline hover:bg-surface-hover'
      )}
    >
      {children}
    </button>
  );
}
