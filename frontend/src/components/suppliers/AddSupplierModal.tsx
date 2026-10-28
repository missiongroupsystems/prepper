'use client';

/**
 * Add supplier — a SidePanel with the name, then how to reach them. The name is kept from the
 * modal it replaced so callers are unchanged.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateSupplier } from '@/lib/hooks';
import { Input } from '@/components/ui';
import { FormPanel } from '@/components/forms/FormPanel';
import { FieldRow, FormField, FormSection, fieldA11y } from '@/components/forms/FormField';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddSupplierModal({ isOpen, onClose }: AddSupplierModalProps) {
  const createSupplier = useCreateSupplier();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [attempted, setAttempted] = useState(false);
  const nameError = attempted && !name.trim() ? 'Supplier name is required' : undefined;

  const resetForm = () => {
    setName('');
    setAddress('');
    setPhone('');
    setEmail('');
    setAttempted(false);
  };

  const handleSubmit = () => {
    setAttempted(true);
    if (!name.trim()) return;
    createSupplier.mutate(
      {
        name: name.trim(),
        address: address.trim() || undefined,
        phone_number: phone.trim() || undefined,
        email: email.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Supplier created');
          resetForm();
          onClose();
        },
        onError: () => toast.error('Failed to create supplier'),
      }
    );
  };

  return (
    <FormPanel
      open={isOpen}
      onClose={onClose}
      title="Add supplier"
      onSubmit={handleSubmit}
      submitLabel="Create supplier"
      pending={createSupplier.isPending}
    >
      <FormSection title="Supplier">
        <FormField id="supplier-name" label="Name" error={nameError}>
          <Input
            {...fieldA11y('supplier-name', nameError)}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fresh Farms"
            autoFocus
          />
        </FormField>
      </FormSection>

      <FormSection title="Contact" description="Optional. Shown on the supplier's page and on orders.">
        <FieldRow>
          <FormField id="supplier-phone" label="Phone" optional>
            <Input
              {...fieldA11y('supplier-phone')}
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +65 1234 5678"
            />
          </FormField>
          <FormField id="supplier-email" label="Email" optional>
            <Input
              {...fieldA11y('supplier-email')}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. orders@supplier.com"
            />
          </FormField>
        </FieldRow>
        <FormField id="supplier-address" label="Address" optional>
          <Input
            {...fieldA11y('supplier-address')}
            autoComplete="street-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Main Street, Singapore"
          />
        </FormField>
      </FormSection>
    </FormPanel>
  );
}
