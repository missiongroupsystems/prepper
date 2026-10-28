'use client';

/**
 * ImportMenu — one secondary "Import" button whose menu holds a list's file imports and their
 * templates, in groups. The label stays visible at every width, so the button is never an
 * unlabelled chevron on a phone.
 */
import { Fragment } from 'react';
import { ChevronDown, Download, Upload } from 'lucide-react';
import { Button, Menu, MenuItem, MenuSeparator } from '@/components/ui';

export interface ImportMenuItem {
  label: string;
  kind: 'import' | 'download';
  onSelect: () => void;
  disabled?: boolean;
}

export function ImportMenu({ label = 'Import', groups }: { label?: string; groups: ImportMenuItem[][] }) {
  return (
    <Menu
      label={`${label} options`}
      trigger={(props) => (
        <Button variant="secondary" {...props}>
          <Upload className="size-4" strokeWidth={1.5} aria-hidden="true" />
          {label}
          <ChevronDown className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
        </Button>
      )}
    >
      {groups.map((group, i) => (
        <Fragment key={i}>
          {i > 0 && <MenuSeparator />}
          {group.map((item) => (
            <MenuItem
              key={item.label}
              icon={item.kind === 'import' ? Upload : Download}
              onSelect={item.onSelect}
              disabled={item.disabled}
            >
              {item.label}
            </MenuItem>
          ))}
        </Fragment>
      ))}
    </Menu>
  );
}
