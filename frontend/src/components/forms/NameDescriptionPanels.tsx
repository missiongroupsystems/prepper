'use client';

/**
 * The create and edit panels for the simple reference records — ingredient tags, allergens,
 * dish categories — that are just a name and an optional description. Create submits once;
 * edit autosaves each field on blur.
 */
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Input, Textarea } from '@/components/ui';
import { FormPanel } from './FormPanel';
import { FormField, fieldA11y } from './FormField';
import { AutosaveTextField } from './AutosaveTextField';

export interface NameDescription {
  name: string;
  description: string | null;
}

interface Copy {
  /** Lower-case noun: "tag", "allergen", "category". */
  noun: string;
  namePlaceholder: string;
  descriptionPlaceholder: string;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function NameDescriptionCreatePanel({
  open,
  onClose,
  copy,
  create,
}: {
  open: boolean;
  onClose: () => void;
  copy: Copy;
  /** Creates the record; rejects with an Error to show its message. */
  create: (data: NameDescription) => Promise<unknown>;
}) {
  const id = useId();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const nameError = attempted && !name.trim() ? `${capitalise(copy.noun)} name is required` : undefined;

  const handleSubmit = async () => {
    setAttempted(true);
    if (!name.trim()) return;
    setPending(true);
    try {
      await create({ name: name.trim(), description: description.trim() || null });
      toast.success(`${capitalise(copy.noun)} created`);
      setName('');
      setDescription('');
      setAttempted(false);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to create ${copy.noun}`);
    } finally {
      setPending(false);
    }
  };

  return (
    <FormPanel
      open={open}
      onClose={onClose}
      title={`Add ${copy.noun}`}
      onSubmit={handleSubmit}
      submitLabel={`Create ${copy.noun}`}
      pending={pending}
    >
      <FormField id={`${id}-name`} label="Name" error={nameError}>
        <Input
          {...fieldA11y(`${id}-name`, nameError)}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={copy.namePlaceholder}
          autoFocus
        />
      </FormField>
      <FormField id={`${id}-description`} label="Description" optional>
        <Textarea
          {...fieldA11y(`${id}-description`)}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={copy.descriptionPlaceholder}
          rows={3}
        />
      </FormField>
    </FormPanel>
  );
}

export function NameDescriptionEditPanel({
  record,
  onClose,
  copy,
  update,
}: {
  /** The record being edited; the panel is open while it is set. */
  record: NameDescription | null;
  onClose: () => void;
  copy: Copy;
  /** Saves one changed field. */
  update: (patch: Partial<NameDescription>) => Promise<unknown>;
}) {
  const id = useId();

  const save = (patch: Partial<NameDescription>) => {
    update(patch).catch(() => toast.error(`Failed to update ${copy.noun}`));
  };

  return (
    <FormPanel
      open={record !== null}
      onClose={onClose}
      title={`Edit ${copy.noun}`}
      description="Changes save as you go."
      doneLabel="Done"
    >
      {record && (
        <>
          <AutosaveTextField
            id={`${id}-name`}
            label="Name"
            required
            value={record.name}
            placeholder={copy.namePlaceholder}
            onCommit={(name) => save({ name })}
          />
          <AutosaveTextField
            id={`${id}-description`}
            label="Description"
            multiline
            value={record.description ?? ''}
            placeholder={copy.descriptionPlaceholder}
            onCommit={(description) => save({ description: description || null })}
          />
        </>
      )}
    </FormPanel>
  );
}
