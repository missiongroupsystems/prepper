'use client';

/**
 * SupplierLinkPanel — the create form for a supplier ↔ ingredient link, in a SidePanel. The
 * ingredient page picks a supplier; the supplier page picks an ingredient. Outlet is fixed when
 * the user works inside one outlet.
 */
import { useId, useState, type FormEvent } from 'react';
import { Button, Checkbox, FieldHint, Input, Label, PendingButton, Select, SidePanel, type SelectOption } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { UNIT_OPTIONS, parsePositive } from './supplierLinks';

export interface SupplierLinkValues {
  counterpartId: number;
  outletId: number;
  sku: string | null;
  packSize: number;
  packUnit: string;
  pricePerPack: number;
  isPreferred: boolean;
}

interface SupplierLinkPanelProps {
  open: boolean;
  onClose: () => void;
  /** "Supplier" on the ingredient page, "Ingredient" on the supplier page. */
  counterpartLabel: 'Supplier' | 'Ingredient';
  counterpartOptions: SelectOption[];
  outletOptions: SelectOption[];
  /** The user's working outlet; when set the outlet field is locked to it. */
  lockedOutletId: number | null;
  /** Description line under the title, naming the record being linked to. */
  description: string;
  pending: boolean;
  /** Resolves `true` when the link was created, so the form resets and closes. */
  onSubmit: (values: SupplierLinkValues) => Promise<boolean>;
}

function emptyForm() {
  return {
    counterpartId: '',
    outletId: '',
    sku: '',
    packSize: '',
    packUnit: '',
    pricePerPack: '',
    isPreferred: false,
  };
}

export function SupplierLinkPanel({
  open,
  onClose,
  counterpartLabel,
  counterpartOptions,
  outletOptions,
  lockedOutletId,
  description,
  pending,
  onSubmit,
}: SupplierLinkPanelProps) {
  const formId = useId();
  const ids = { counterpart: useId(), outlet: useId(), sku: useId(), size: useId(), unit: useId(), price: useId() };
  const [form, setForm] = useState(emptyForm);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  // The working outlet can arrive after mount, so it is read here rather than seeded into state.
  const outletId = lockedOutletId !== null ? String(lockedOutletId) : form.outletId;
  const packSize = parsePositive(form.packSize);
  const pricePerPack = parsePositive(form.pricePerPack);
  const complete = Boolean(form.counterpartId && outletId && form.packUnit && packSize && pricePerPack);
  const noun = counterpartLabel.toLowerCase();

  const close = () => {
    setForm(emptyForm());
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!complete || packSize === null || pricePerPack === null) return;
    const created = await onSubmit({
      counterpartId: parseInt(form.counterpartId, 10),
      outletId: parseInt(outletId, 10),
      sku: form.sku.trim() || null,
      packSize,
      packUnit: form.packUnit,
      pricePerPack,
      isPreferred: form.isPreferred,
    });
    if (created) close();
  };

  return (
    <SidePanel
      open={open}
      onClose={close}
      title={`Link ${noun}`}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <PendingButton type="submit" form={formId} disabled={!complete} pending={pending}>
            Link {noun}
          </PendingButton>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.counterpart}>{counterpartLabel}</Label>
          <Select
            id={ids.counterpart}
            value={form.counterpartId}
            onChange={(e) => set('counterpartId', e.target.value)}
            options={[{ value: '', label: `Select ${noun}…` }, ...counterpartOptions]}
          />
          {counterpartOptions.length === 0 && <FieldHint>Every {noun} in the list is already linked.</FieldHint>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.outlet}>Outlet</Label>
          <Select
            id={ids.outlet}
            value={outletId}
            onChange={(e) => set('outletId', e.target.value)}
            disabled={lockedOutletId !== null}
            aria-describedby={lockedOutletId !== null ? `${ids.outlet}-hint` : undefined}
            options={[{ value: '', label: 'Select outlet…' }, ...outletOptions]}
          />
          {lockedOutletId !== null && <FieldHint id={`${ids.outlet}-hint`}>Set by the outlet you are working in.</FieldHint>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.sku}>SKU</Label>
          <Input id={ids.sku} placeholder="e.g. SKU-001" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.size}>Pack size</Label>
            <Input
              id={ids.size}
              inputMode="decimal"
              placeholder="0"
              value={form.packSize}
              onChange={(e) => set('packSize', e.target.value)}
              className="text-right tabular-nums"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.unit}>Pack unit</Label>
            <Select
              id={ids.unit}
              value={form.packUnit}
              onChange={(e) => set('packUnit', e.target.value)}
              options={[{ value: '', label: 'Select unit…' }, ...UNIT_OPTIONS]}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.price}>Price per pack</Label>
          <Input
            id={ids.price}
            inputMode="decimal"
            placeholder="0.00"
            value={form.pricePerPack}
            onChange={(e) => set('pricePerPack', e.target.value)}
            aria-describedby={`${ids.price}-hint`}
            className="text-right tabular-nums"
          />
          <FieldHint id={`${ids.price}-hint`} className="tabular-nums">
            Unit cost {formatCurrency(packSize && pricePerPack ? pricePerPack / packSize : 0)}
            {form.packUnit && ` / ${form.packUnit}`}
          </FieldHint>
        </div>
        <Checkbox
          checked={form.isPreferred}
          onChange={(e) => set('isPreferred', e.target.checked)}
          label="Preferred supplier"
        />
      </form>
    </SidePanel>
  );
}
