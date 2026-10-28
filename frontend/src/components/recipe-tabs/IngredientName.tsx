/**
 * An ingredient name as the recipe tabs show it: imported ALL-CAPS names sentence-cased, and a
 * leading FMH code split off onto its own muted line.
 */
import { EntityCode } from '@/components/ui';
import { displayNameParts } from '@/lib/format/displayName';

export function IngredientName({ name, className }: { name: string; className?: string }) {
  const { code, name: display } = displayNameParts(name);
  return (
    <span className={className}>
      {code && <EntityCode>{code}</EntityCode>}
      {display}
    </span>
  );
}
