/**
 * The Select primitive's non-visual half: reading `<option>` / `<optgroup>` children into a flat
 * list, placing the list against the viewport, and writing a pick back to the hidden native
 * `<select>`. The why of each lives in `Select.tsx`'s header.
 */
import { Children, Fragment, isValidElement, type ReactNode } from 'react';

const PANEL_GAP_PX = 4;
const PANEL_MAX_HEIGHT_PX = 320;
const PANEL_MIN_WIDTH_PX = 192;
const VIEWPORT_MARGIN_PX = 8;

export interface Option {
  value: string;
  label: string;
  description: string | null;
  disabled: boolean;
  group: string | null;
}

export interface Placement {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

type OptionLikeProps = {
  children?: ReactNode;
  value?: string | number | readonly string[];
  label?: string;
  disabled?: boolean;
  title?: string;
};

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<OptionLikeProps>(node)) return textOf(node.props.children);
  return '';
}

/** Reads `<option>` / `<optgroup>` children (through fragments and arrays) into a flat list. */
export function collectOptions(children: ReactNode, group: string | null = null, out: Option[] = []): Option[] {
  Children.forEach(children, (child) => {
    if (!isValidElement<OptionLikeProps>(child)) return;
    if (child.type === Fragment) {
      collectOptions(child.props.children, group, out);
    } else if (child.type === 'optgroup') {
      collectOptions(child.props.children, child.props.label ?? null, out);
    } else if (child.type === 'option') {
      const label = textOf(child.props.children);
      out.push({
        value: child.props.value === undefined ? label : String(child.props.value),
        label,
        description: child.props.title ?? null,
        disabled: !!child.props.disabled,
        group,
      });
    }
  });
  return out;
}

export function placeBelowOrAbove(trigger: HTMLElement): Placement {
  const r = trigger.getBoundingClientRect();
  const below = window.innerHeight - r.bottom - PANEL_GAP_PX - VIEWPORT_MARGIN_PX;
  const above = r.top - PANEL_GAP_PX - VIEWPORT_MARGIN_PX;
  const openUp = below < PANEL_MAX_HEIGHT_PX && above > below;
  const width = Math.max(r.width, PANEL_MIN_WIDTH_PX);
  const left = Math.max(VIEWPORT_MARGIN_PX, Math.min(r.left, window.innerWidth - width - VIEWPORT_MARGIN_PX));
  const maxHeight = Math.min(PANEL_MAX_HEIGHT_PX, openUp ? above : below);
  return openUp
    ? { left, width, maxHeight, bottom: window.innerHeight - r.top + PANEL_GAP_PX }
    : { left, width, maxHeight, top: r.bottom + PANEL_GAP_PX };
}

/** Writes through the native setter so React's change tracking sees a real user change. */
export function commitToNative(el: HTMLSelectElement, value: string): void {
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set?.call(el, value);
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
