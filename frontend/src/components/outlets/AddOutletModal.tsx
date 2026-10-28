'use client';

/**
 * Add outlet — a SidePanel: what the outlet is called, then where it sits in the brand /
 * location hierarchy. The server rejects a parent that would make a cycle. The name is kept
 * from the modal it replaced so callers are unchanged.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateOutlet, useOutlets } from '@/lib/hooks';
import { Input, Select } from '@/components/ui';
import { FormPanel } from '@/components/forms/FormPanel';
import { FieldRow, FormField, FormSection, fieldA11y } from '@/components/forms/FormField';
import type { OutletType } from '@/types';

const LOOKUP_PAGE_SIZE = 30;

export const OUTLET_TYPE_OPTIONS = [
  { value: 'brand', label: 'Brand' },
  { value: 'location', label: 'Location' },
];

interface AddOutletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddOutletModal({ isOpen, onClose }: AddOutletModalProps) {
  const createOutlet = useCreateOutlet();
  const { data: allOutletsData } = useOutlets({ page_size: LOOKUP_PAGE_SIZE });
  const allOutlets = allOutletsData?.items ?? [];

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [outletType, setOutletType] = useState<OutletType>('brand');
  const [parentOutletId, setParentOutletId] = useState('');
  const [attempted, setAttempted] = useState(false);
  const nameError = attempted && !name.trim() ? 'Outlet name is required' : undefined;
  const codeError = attempted && !code.trim() ? 'Outlet code is required' : undefined;

  const resetForm = () => {
    setName('');
    setCode('');
    setOutletType('brand');
    setParentOutletId('');
    setAttempted(false);
  };

  const handleSubmit = () => {
    setAttempted(true);
    if (!name.trim() || !code.trim()) return;
    createOutlet.mutate(
      {
        name: name.trim(),
        code: code.trim(),
        outlet_type: outletType,
        parent_outlet_id: parentOutletId ? parseInt(parentOutletId, 10) : null,
      },
      {
        onSuccess: () => {
          toast.success('Outlet created');
          resetForm();
          onClose();
        },
        onError: () => toast.error('Failed to create outlet'),
      }
    );
  };

  return (
    <FormPanel
      open={isOpen}
      onClose={onClose}
      title="Add outlet"
      onSubmit={handleSubmit}
      submitLabel="Create outlet"
      pending={createOutlet.isPending}
    >
      <FormSection title="Outlet">
        <FieldRow>
          <FormField id="outlet-name" label="Name" error={nameError}>
            <Input
              {...fieldA11y('outlet-name', nameError)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main branch"
              autoFocus
            />
          </FormField>
          <FormField id="outlet-code" label="Code" error={codeError} hint="A short tag, e.g. CS or TBH.">
            <Input
              {...fieldA11y('outlet-code', codeError, true)}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. MBR"
            />
          </FormField>
        </FieldRow>
      </FormSection>

      <FormSection title="Hierarchy" description="Locations usually sit under a brand.">
        <FieldRow>
          <FormField id="outlet-type" label="Type">
            <Select
              {...fieldA11y('outlet-type')}
              value={outletType}
              onChange={(e) => setOutletType(e.target.value as OutletType)}
              options={OUTLET_TYPE_OPTIONS}
            />
          </FormField>
          <FormField id="outlet-parent" label="Parent outlet" optional>
            <Select
              {...fieldA11y('outlet-parent')}
              value={parentOutletId}
              onChange={(e) => setParentOutletId(e.target.value)}
              options={[
                { value: '', label: 'None' },
                ...allOutlets.map((o) => ({ value: o.id.toString(), label: `${o.name} (${o.code})` })),
              ]}
            />
          </FormField>
        </FieldRow>
      </FormSection>
    </FormPanel>
  );
}
