/** One dish in the menu preview, as a card (with its photo) or as a list row. */
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import { formatCurrency } from '@/lib/utils';
import type { MenuItemRead, Recipe } from '@/types';

interface Allergen {
  id: number;
  name: string;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[13px] leading-5 font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Prose({ text, empty }: { text: string | null | undefined; empty: string }) {
  return text ? (
    <p className="text-sm leading-relaxed text-ink">{text}</p>
  ) : (
    <p className="text-sm text-tertiary">{empty}</p>
  );
}

function Tags({ names, variant, empty }: { names: string[]; variant: 'neutral' | 'warning'; empty: string }) {
  if (names.length === 0) return <p className="text-sm text-tertiary">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {names.map((name) => (
        <Badge key={name} variant={variant}>
          {name}
        </Badge>
      ))}
    </div>
  );
}

export function MenuPreviewItem({
  item,
  recipe,
  allergens,
  categoryNames,
  layout,
}: {
  item: MenuItemRead;
  recipe: Recipe | undefined;
  allergens: Allergen[];
  categoryNames: string[];
  layout: 'card' | 'list';
}) {
  const name = formatDisplayName(item.recipe_name);
  const price = item.display_price !== null && (
    <p className="shrink-0 text-base font-medium text-ink tabular-nums">{formatCurrency(item.display_price)}</p>
  );
  const fields = (
    <>
      <Field label="Description">
        <Prose text={recipe?.description} empty="No description written" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Categories">
          <Tags names={categoryNames} variant="neutral" empty="None" />
        </Field>
        <Field label="Allergens">
          <Tags names={allergens.map((a) => a.name)} variant="warning" empty="None listed" />
        </Field>
      </div>
      <Field label="Key highlights">
        <Prose text={item.key_highlights} empty="No key highlights written" />
      </Field>
      <Field label="Additional info">
        <Prose text={item.additional_info} empty="No additional info written" />
      </Field>
      <Field label="Substitution">
        <Prose text={item.substitution} empty="No substitution available" />
      </Field>
    </>
  );

  if (layout === 'list') {
    return (
      <li className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-base font-medium text-ink">{name}</h3>
          {price}
        </div>
        {fields}
      </li>
    );
  }

  return (
    <li className="flex flex-col overflow-hidden rounded-lg bg-card hairline">
      <div className="relative aspect-video w-full bg-surface-sunken">
        {recipe?.image_url && <Image src={recipe.image_url} alt={name} fill className="object-cover" />}
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-base font-medium text-ink">{name}</h3>
          {price}
        </div>
        {fields}
      </div>
    </li>
  );
}
