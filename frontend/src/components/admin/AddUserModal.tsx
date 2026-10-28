'use client';

/**
 * Add user — a SidePanel: the sign-in details, then the role and outlet that scope what they
 * can see. The name is kept from the modal it replaced so callers are unchanged.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateUser, useOutlets } from '@/lib/hooks';
import { Input, Select } from '@/components/ui';
import { FormPanel } from '@/components/forms/FormPanel';
import { FieldRow, FormField, FormSection, fieldA11y } from '@/components/forms/FormField';
import type { UserType } from '@/types';

const LOOKUP_PAGE_SIZE = 30;

const USER_TYPE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'admin', label: 'Admin' },
];

type Field = 'email' | 'username' | 'password';

const REQUIRED: Record<Field, string> = {
  email: 'Email is required',
  username: 'Username is required',
  password: 'Password is required',
};

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  const createUser = useCreateUser();
  const { data: outletsData } = useOutlets({ page_size: LOOKUP_PAGE_SIZE });
  const outlets = outletsData?.items ?? [];

  const [values, setValues] = useState<Record<Field, string>>({ email: '', username: '', password: '' });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userType, setUserType] = useState<UserType>('normal');
  const [outletId, setOutletId] = useState('');
  const [attempted, setAttempted] = useState(false);

  const errorFor = (field: Field) => (attempted && !values[field].trim() ? REQUIRED[field] : undefined);
  const set = (field: Field) => (e: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const resetForm = () => {
    setValues({ email: '', username: '', password: '' });
    setPhoneNumber('');
    setUserType('normal');
    setOutletId('');
    setAttempted(false);
  };

  const handleSubmit = () => {
    setAttempted(true);
    if ((Object.keys(REQUIRED) as Field[]).some((field) => !values[field].trim())) return;
    createUser.mutate(
      {
        email: values.email.trim(),
        username: values.username.trim(),
        password: values.password.trim(),
        phone_number: phoneNumber || undefined,
        user_type: userType,
        outlet_id: outletId ? parseInt(outletId, 10) : null,
      },
      {
        onSuccess: () => {
          toast.success('User created');
          resetForm();
          onClose();
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to create user'),
      }
    );
  };

  return (
    <FormPanel
      open={isOpen}
      onClose={onClose}
      title="Add user"
      onSubmit={handleSubmit}
      submitLabel="Create user"
      pending={createUser.isPending}
    >
      <FormSection title="Sign-in">
        <FormField id="user-email" label="Email" error={errorFor('email')}>
          <Input
            {...fieldA11y('user-email', errorFor('email'))}
            type="email"
            autoComplete="off"
            value={values.email}
            onChange={set('email')}
            placeholder="name@example.com"
            autoFocus
          />
        </FormField>
        <FieldRow>
          <FormField id="user-username" label="Username" error={errorFor('username')}>
            <Input
              {...fieldA11y('user-username', errorFor('username'))}
              autoComplete="off"
              value={values.username}
              onChange={set('username')}
            />
          </FormField>
          <FormField id="user-password" label="Password" error={errorFor('password')}>
            <Input
              {...fieldA11y('user-password', errorFor('password'))}
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={set('password')}
            />
          </FormField>
        </FieldRow>
        <FormField id="user-phone" label="Phone" optional hint="Used for tasting invitations by SMS.">
          <Input
            {...fieldA11y('user-phone', undefined, true)}
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g. +65 1234 5678"
          />
        </FormField>
      </FormSection>

      <FormSection title="Access" description="Normal users see only their outlet and the outlets under it.">
        <FieldRow>
          <FormField id="user-type" label="Role">
            <Select
              {...fieldA11y('user-type')}
              value={userType}
              onChange={(e) => setUserType(e.target.value as UserType)}
              options={USER_TYPE_OPTIONS}
            />
          </FormField>
          <FormField id="user-outlet" label="Outlet" optional>
            <Select
              {...fieldA11y('user-outlet')}
              value={outletId}
              onChange={(e) => setOutletId(e.target.value)}
              options={[{ value: '', label: 'None' }, ...outlets.map((o) => ({ value: o.id.toString(), label: o.name }))]}
            />
          </FormField>
        </FieldRow>
      </FormSection>
    </FormPanel>
  );
}
