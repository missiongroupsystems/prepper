'use client';

/**
 * DropdownButton — a secondary Button that opens a Menu of actions. Kept for existing callers;
 * new code can compose `Menu` + `MenuItem` directly.
 */
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonClasses } from './Button';
import { Menu, MenuItem } from './Menu';

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface DropdownButtonProps {
  label: string;
  icon?: ReactNode;
  items: DropdownItem[];
  className?: string;
}

export function DropdownButton({ label, icon, items, className }: DropdownButtonProps) {
  return (
    <Menu
      label={label}
      className={className}
      trigger={({ ref, ...triggerProps }) => (
        <button
          ref={ref}
          type="button"
          aria-label={label}
          className={cn(buttonClasses('secondary', 'md'), 'group')}
          {...triggerProps}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
          <ChevronDown
            className="size-3.5 transition-transform duration-(--dur-quick) group-aria-expanded:rotate-180"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </button>
      )}
    >
      {items.map((item) => (
        <MenuItem key={item.label} onSelect={item.onClick} disabled={item.disabled}>
          {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
          {item.label}
        </MenuItem>
      ))}
    </Menu>
  );
}
