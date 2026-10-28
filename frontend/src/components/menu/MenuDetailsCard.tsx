'use client';

/** The menu's own fields: name, published, and the outlets it is served at. */
import { useId } from 'react';
import { Card, Checkbox, FieldHint, Input, Label, Skeleton, Switch } from '@/components/ui';
import { useOutlets } from '@/lib/hooks';
import { formatDisplayName } from '@/lib/format/displayName';
import type { MenuDraft } from './menuDraft';

const OUTLET_PAGE_SIZE = 100;

export function MenuDetailsCard({
  draft,
  onName,
  onPublished,
  onOutlet,
}: {
  draft: MenuDraft;
  onName: (name: string) => void;
  onPublished: (published: boolean) => void;
  onOutlet: (outletId: number, on: boolean) => void;
}) {
  const id = useId();
  const { data: outletsData, isLoading } = useOutlets({ page_size: OUTLET_PAGE_SIZE });
  const outlets = outletsData?.items ?? [];

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-name`}>Menu name</Label>
        <Input
          id={`${id}-name`}
          name="name"
          value={draft.name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Autumn dinner"
          aria-required="true"
        />
      </div>

      <Switch checked={draft.is_published} onCheckedChange={onPublished} label="Published" />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[13px] leading-5 font-medium text-muted-foreground">Outlets</legend>
        {isLoading ? (
          <Skeleton className="h-16 rounded-md" />
        ) : (
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {outlets.map((outlet) => (
              <Checkbox
                key={outlet.id}
                checked={draft.outlet_ids.includes(outlet.id)}
                onChange={(e) => onOutlet(outlet.id, e.target.checked)}
                label={formatDisplayName(outlet.name)}
              />
            ))}
          </div>
        )}
        <FieldHint>Where this menu is served. Pick at least one.</FieldHint>
      </fieldset>
    </Card>
  );
}
