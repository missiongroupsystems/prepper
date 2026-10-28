'use client';

import { Card, EditableCell } from '@/components/ui';
import { DetailField, DetailList, RecordTimestamps, inlineEditClasses } from '@/components/catalogue';
import type { Supplier, UpdateSupplierRequest } from '@/types';

type ContactField = 'code' | 'email' | 'phone_number' | 'address' | 'shipping_company_name';

const FIELDS: ReadonlyArray<{ key: ContactField; label: string; placeholder: string; type?: 'email'; wide?: boolean }> = [
  { key: 'code', label: 'Code', placeholder: 'Add code' },
  { key: 'email', label: 'Email', placeholder: 'Add email', type: 'email' },
  { key: 'phone_number', label: 'Phone', placeholder: 'Add phone number' },
  { key: 'shipping_company_name', label: 'Shipping company', placeholder: 'Add shipping company' },
  { key: 'address', label: 'Shipping address', placeholder: 'Add shipping address', wide: true },
];

interface SupplierContactProps {
  supplier: Supplier;
  displayName: string;
  onUpdate: (data: UpdateSupplierRequest) => void;
}

export function SupplierContact({ supplier, displayName, onUpdate }: SupplierContactProps) {
  return (
    <Card className="flex flex-col gap-5">
      <DetailList>
        <DetailField label="Name" wide>
          <EditableCell
            value={supplier.name}
            displayValue={displayName}
            onSave={(value) => value.trim() && onUpdate({ name: value.trim() })}
            className={inlineEditClasses}
          />
        </DetailField>
        {FIELDS.map((field) => (
          <DetailField key={field.key} label={field.label} wide={field.wide}>
            <EditableCell
              type={field.type}
              value={supplier[field.key] ?? ''}
              placeholder={field.placeholder}
              onSave={(value) => onUpdate({ [field.key]: value.trim() || null })}
              className={inlineEditClasses}
            />
          </DetailField>
        ))}
      </DetailList>
      <RecordTimestamps createdAt={supplier.created_at} updatedAt={supplier.updated_at} />
    </Card>
  );
}
