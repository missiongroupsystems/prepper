'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Button,
  ConfirmModal,
  Dialog,
  FieldHint,
  Input,
  Label,
  Modal,
  Select,
  SidePanel,
  Textarea,
} from '@/components/ui';
import { Section, Subsection } from './primitives';

type Open = 'dialog-sm' | 'dialog-md' | 'dialog-lg' | 'panel' | 'confirm' | 'modal' | null;

const DEMO_PENDING_MS = 1200;

/** Dialog interrupts (confirm), SidePanel accompanies (create / edit / detail), toasts report outcomes. */
export function OverlaysSection() {
  const [open, setOpen] = useState<Open>(null);
  const [pending, setPending] = useState(false);
  const close = () => setOpen(null);

  const confirmDelete = () => {
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      close();
      toast.success('Recipe deleted');
    }, DEMO_PENDING_MS);
  };

  return (
    <Section title="Overlays and feedback">
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Focus moves in and is trapped, Escape and the backdrop close, the page stops scrolling, and focus
        returns to the trigger. Actions sit in the pinned footer, never inline in the scroll area.
      </p>
      <Subsection title="Dialog and side panel">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setOpen('dialog-sm')}>
            Dialog sm
          </Button>
          <Button variant="secondary" onClick={() => setOpen('dialog-md')}>
            Dialog md
          </Button>
          <Button variant="secondary" onClick={() => setOpen('dialog-lg')}>
            Dialog lg
          </Button>
          <Button variant="secondary" onClick={() => setOpen('panel')}>
            Open side panel
          </Button>
          <Button variant="danger" onClick={() => setOpen('confirm')}>
            Delete recipe
          </Button>
          <Button variant="ghost" onClick={() => setOpen('modal')}>
            Legacy modal
          </Button>
        </div>
      </Subsection>

      <Subsection title="Toasts (sonner, restyled)">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => toast.success('Recipe saved')}>
            Success
          </Button>
          <Button variant="secondary" onClick={() => toast.error('Could not update the price. Try again.')}>
            Error
          </Button>
          <Button variant="secondary" onClick={() => toast.warning('Two ingredients have no supplier price')}>
            Warning
          </Button>
          <Button variant="secondary" onClick={() => toast.info('Costs recalculate overnight')}>
            Info
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast('Ingredient removed', { action: { label: 'Undo', onClick: () => toast.success('Restored') } })
            }
          >
            With action
          </Button>
        </div>
      </Subsection>

      {(['dialog-sm', 'dialog-md', 'dialog-lg'] as const).map((key) => (
        <Dialog
          key={key}
          open={open === key}
          onClose={close}
          size={key === 'dialog-sm' ? 'sm' : key === 'dialog-md' ? 'md' : 'lg'}
          title="Rename recipe"
          description="The new name shows on menus and costing sheets."
          footer={
            <>
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button onClick={close}>Rename</Button>
            </>
          }
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${key}-name`}>Name</Label>
            <Input id={`${key}-name`} defaultValue="Beef bourguignon" />
          </div>
        </Dialog>
      ))}

      <SidePanel
        open={open === 'panel'}
        onClose={close}
        title="New ingredient"
        description="Add it to the library; prices can follow."
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button onClick={close}>Add ingredient</Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="panel-name">Name</Label>
            <Input id="panel-name" placeholder="e.g. Shallots" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="panel-unit">Base unit</Label>
            <Select
              id="panel-unit"
              defaultValue="g"
              options={[
                { value: 'g', label: 'Grams' },
                { value: 'ml', label: 'Millilitres' },
                { value: 'each', label: 'Each' },
              ]}
            />
            <FieldHint>Costs are calculated per base unit.</FieldHint>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="panel-notes">Notes</Label>
            <Textarea id="panel-notes" rows={6} />
          </div>
        </div>
      </SidePanel>

      <ConfirmModal
        isOpen={open === 'confirm'}
        onClose={close}
        onConfirm={confirmDelete}
        pending={pending}
        variant="destructive"
        title="Delete this recipe?"
        message="Its versions and tasting notes are deleted too. This cannot be undone."
        confirmLabel="Delete recipe"
      />

      <Modal
        isOpen={open === 'modal'}
        onClose={close}
        title="Legacy modal"
        footer={<Button onClick={close}>Done</Button>}
      >
        <p className="text-sm text-muted-foreground">
          The old <code className="font-mono text-xs">Modal</code> props, now rendered by Dialog.
        </p>
      </Modal>
    </Section>
  );
}
