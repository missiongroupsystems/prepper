'use client';

import { useState } from 'react';
import {
  Checkbox,
  EditableCell,
  FieldError,
  FieldHint,
  Input,
  Label,
  NumericInput,
  SearchInput,
  Select,
  Switch,
  Textarea,
} from '@/components/ui';
import { Section, Subsection } from './primitives';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'testing', label: 'Testing' },
  { value: 'approved', label: 'Approved' },
  { value: 'archived', label: 'Archived' },
];

const UNITS = ['g', 'kg', 'ml', 'l', 'each', 'bunch', 'tsp', 'tbsp', 'cup', 'oz', 'lb'];

/** Fields: label above, sunken 8px control, hint or danger-toned error below. */
export function FormsSection() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('draft');
  const [unit, setUnit] = useState('g');
  const [quantity, setQuantity] = useState(250);
  const [name, setName] = useState('Brown butter');
  const [archived, setArchived] = useState(false);
  const [dragDrop, setDragDrop] = useState(true);

  return (
    <Section title="Form controls">
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Sunken field, 1px control border, 8px radius, 36px tall (44px with 16px text on a phone).
        Invalid fields set <code className="font-mono text-xs">aria-invalid</code> and point{' '}
        <code className="font-mono text-xs">aria-describedby</code> at a FieldError — the danger
        tone, never the accent.
      </p>
      <div className="grid max-w-3xl grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-name">Recipe name</Label>
          <Input id="ds-name" placeholder="e.g. Brown butter" aria-describedby="ds-name-hint" />
          <FieldHint id="ds-name-hint">Shown on the menu and the costing sheet.</FieldHint>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-yield">Yield</Label>
          <Input id="ds-yield" defaultValue="0" aria-invalid="true" aria-describedby="ds-yield-error" />
          <FieldError id="ds-yield-error">Yield must be more than zero.</FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-disabled">Disabled</Label>
          <Input id="ds-disabled" defaultValue="Read only for your role" disabled />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-search">Search</Label>
          <SearchInput
            id="ds-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="Search ingredients…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-status">Status (short list)</Label>
          <Select id="ds-status" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-unit">Unit (searchable from 8 options)</Label>
          <Select id="ds-unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
            <optgroup label="Weight">
              {UNITS.slice(0, 2).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </optgroup>
            <optgroup label="Other">
              {UNITS.slice(2).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </optgroup>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-invalid-select">Invalid select</Label>
          <Select
            id="ds-invalid-select"
            defaultValue=""
            aria-invalid="true"
            aria-describedby="ds-invalid-select-error"
            options={[{ value: '', label: 'Choose a supplier' }, ...STATUS_OPTIONS]}
          />
          <FieldError id="ds-invalid-select-error">Choose a supplier.</FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-qty">Quantity (NumericInput, commits on blur)</Label>
          <NumericInput id="ds-qty" value={quantity} onChange={setQuantity} min={0} className="w-32" />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <Label htmlFor="ds-notes">Method notes</Label>
          <Textarea id="ds-notes" placeholder="Add a step…" />
        </div>
      </div>

      <div className="mt-8 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
        <Subsection title="Checkbox">
          <div className="flex flex-col gap-3">
            <Checkbox label="Show archived" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
            <Checkbox label="Disabled" disabled />
            <Checkbox label="Checked, disabled" checked disabled readOnly />
          </div>
        </Subsection>
        <Subsection title="Switch">
          <div className="flex flex-col gap-3">
            <Switch label="Drag and drop" checked={dragDrop} onCheckedChange={setDragDrop} />
            <Switch label="Disabled" disabled />
          </div>
        </Subsection>
        <Subsection title="Editable cell">
          <div className="text-sm text-ink">
            <EditableCell value={name} onSave={setName} placeholder="Add a name" />
          </div>
        </Subsection>
      </div>
    </Section>
  );
}
