'use client';

/**
 * Edit one menu item in a SidePanel: the dish, its menu price and the three notes. Every field
 * writes straight to the draft, so it autosaves like the rest of the builder.
 */
import { useId, useState } from 'react';
import { Badge, Button, FieldError, FieldHint, Input, Label, SidePanel, Textarea } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import type { DraftItem, ItemTextField } from './menuDraft';
import { RecipeSearchList } from './RecipeSearchList';

interface Allergen {
  id: number;
  name: string;
}

const TEXT_FIELDS: { field: ItemTextField; label: string; hint: string }[] = [
  { field: 'key_highlights', label: 'Key highlights', hint: 'A signature item, a seasonal special.' },
  { field: 'additional_info', label: 'Additional info', hint: 'Dietary notes, how it is served.' },
  { field: 'substitution', label: 'Substitution', hint: 'What can be swapped, and for what.' },
];

function parsePrice(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function MenuItemPanel({
  item,
  sectionRecipeIds,
  allergens,
  onChange,
  onClose,
}: {
  item: DraftItem;
  /** Dishes already on the item's section; the current one stays pickable. */
  sectionRecipeIds: ReadonlySet<number>;
  allergens: Allergen[];
  onChange: (patch: Partial<DraftItem>) => void;
  onClose: () => void;
}) {
  const id = useId();
  const [priceDraft, setPriceDraft] = useState(item.display_price?.toString() ?? '');
  const [changingDish, setChangingDish] = useState(false);
  const priceInvalid = parsePrice(priceDraft) === undefined;

  const unavailable = new Set([...sectionRecipeIds].filter((rid) => rid !== item.recipe_id));

  const onPrice = (value: string) => {
    setPriceDraft(value);
    const parsed = parsePrice(value);
    if (parsed !== undefined) onChange({ display_price: parsed });
  };

  return (
    <SidePanel open onClose={onClose} title="Edit menu item" description="Changes save automatically.">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Label id={`${id}-dish`}>Dish</Label>
          <div className="flex items-center justify-between gap-3 rounded-md bg-surface-sunken px-3 py-2 hairline">
            <span id={`${id}-dish-name`} className="min-w-0 truncate text-sm text-ink">
              {formatDisplayName(item.recipe_name)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChangingDish((v) => !v)}
              aria-expanded={changingDish}
              aria-describedby={`${id}-dish ${id}-dish-name`}
            >
              {changingDish ? 'Keep this dish' : 'Change dish'}
            </Button>
          </div>
          {changingDish && (
            <RecipeSearchList
              label="Search for a different dish"
              selectedIds={new Set([item.recipe_id])}
              unavailableIds={unavailable}
              onPick={(recipe) => {
                onChange({ recipe_id: recipe.id, recipe_name: recipe.name });
                setChangingDish(false);
              }}
            />
          )}
          {allergens.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Allergens">
              {allergens.map((a) => (
                <Badge key={a.id} variant="warning">
                  {a.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-price`}>Price</Label>
          <Input
            id={`${id}-price`}
            inputMode="decimal"
            value={priceDraft}
            onChange={(e) => onPrice(e.target.value)}
            placeholder="0.00"
            aria-invalid={priceInvalid || undefined}
            aria-describedby={`${id}-price-msg`}
            className="tabular-nums sm:w-40"
          />
          {priceInvalid ? (
            <FieldError id={`${id}-price-msg`}>Enter a price like 18 or 18.50.</FieldError>
          ) : (
            <FieldHint id={`${id}-price-msg`}>The price shown on the menu. Leave empty to hide it.</FieldHint>
          )}
        </div>

        {TEXT_FIELDS.map(({ field, label, hint }) => (
          <div key={field} className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-${field}`}>{label}</Label>
            <Textarea
              id={`${id}-${field}`}
              value={item[field] ?? ''}
              onChange={(e) => onChange({ [field]: e.target.value || null })}
              aria-describedby={`${id}-${field}-hint`}
              rows={3}
            />
            <FieldHint id={`${id}-${field}-hint`}>{hint}</FieldHint>
          </div>
        ))}
      </div>
    </SidePanel>
  );
}
