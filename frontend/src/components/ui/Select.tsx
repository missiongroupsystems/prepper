'use client';

/**
 * Select (§3.4, §11, §12.7) — the sunken 8px field that opens an anchored list, with a search
 * field once the list is long enough to need one. Ported from Workforce: the native OS popup
 * cannot be styled, grouped legibly or searched.
 *
 * A DROP-IN. The API is still `<select>`'s — `<option>` / `<optgroup>` children (or Recipes'
 * `options` array), `value` / `defaultValue`, `onChange(e) => e.target.value`, `name`. A real
 * `<select>` is rendered visually hidden, and every pick is written to it with a native `change`
 * event, so controlled state, handlers and form submission keep working unchanged.
 *
 * `className` styles the visible field (width, height); the wrapper is `display: contents` so a
 * `flex-1` or `w-32` lands on the field itself.
 *
 * Portalled to `<body>` and placed against the viewport, so a select inside a scrolling panel is
 * never clipped. On a phone (coarse pointer below `sm`) the list opens as a bottom sheet with
 * 44px rows, focusing the current option rather than search so the keyboard does not cover it.
 * Escape closes only the list — never the Dialog or SidePanel it sits in.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type SelectHTMLAttributes,
} from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { controlClasses, controlHeight } from './Input';
import { swallowEscape, useAnchoredDismiss } from './useAnchoredDismiss';
import { collectOptions, commitToNative, placeBelowOrAbove, type Option, type Placement } from './selectModel';
import { SelectPanel } from './SelectPanel';
import { Portal } from './Portal';

/** At this many real options a search field appears. */
const SEARCH_THRESHOLD = 8;
/** Typed letters jump to a matching option; a pause this long starts a new prefix. */
const TYPEAHEAD_RESET_MS = 600;
/** A phone: touch, and narrower than the `sm` breakpoint. Read when the list opens. */
const SHEET_QUERY = '(pointer: coarse) and (max-width: 639.98px)';
const OPTION_SELECTOR = '[data-select-option]:not([aria-disabled="true"])';
const MOVES: Record<string, 'next' | 'prev' | 'first' | 'last'> = {
  ArrowDown: 'next',
  ArrowUp: 'prev',
  Home: 'first',
  End: 'last',
};

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Shorthand for `<option>` children. */
  options?: SelectOption[];
  /** Force the search field on or off; unset = on at `SEARCH_THRESHOLD` options. */
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    className,
    children,
    options: optionList,
    searchable,
    searchPlaceholder = 'Search…',
    id,
    value,
    defaultValue,
    disabled,
    required,
    onFocus,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...nativeProps
  },
  forwardedRef
) {
  const optionNodes = optionList
    ? optionList.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))
    : children;
  const options = useMemo(() => collectOptions(optionNodes), [optionNodes]);
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string | undefined>(
    defaultValue === undefined ? undefined : String(defaultValue)
  );
  // An uncontrolled native select with no default shows its first enabled option; so does this.
  const current = isControlled ? String(value) : (internal ?? options.find((o) => !o.disabled)?.value ?? '');
  const selected = options.find((o) => o.value === current);

  const [open, setOpen] = useState(false);
  const [asSheet, setAsSheet] = useState(false);
  const [query, setQuery] = useState('');
  const [placement, setPlacement] = useState<Placement | null>(null);
  const nativeRef = useRef<HTMLSelectElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ text: '', at: 0 });
  const listId = useId();
  const generatedId = useId();
  const triggerId = id ?? generatedId;

  const setNativeRef = useCallback(
    (el: HTMLSelectElement | null) => {
      nativeRef.current = el;
      if (typeof forwardedRef === 'function') forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    },
    [forwardedRef]
  );

  const showSearch = searchable ?? options.filter((o) => o.value !== '').length >= SEARCH_THRESHOLD;

  const dismiss = useCallback(() => setOpen(false), []);
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);
  useAnchoredDismiss({ open, triggerRef, panelRef, onPointerOutside: dismiss, onEscape: close });

  // Follow the field while the list is open: a panel body scrolls under it.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const trigger = triggerRef.current;
    let raf = 0;
    const update = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => setPlacement(placeBelowOrAbove(trigger)));
    };
    setPlacement(placeBelowOrAbove(trigger));
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  // Focus into the list after paint: search first (not on a sheet), else the current option.
  useEffect(() => {
    if (!open) return;
    const raf = window.requestAnimationFrame(() => {
      if (searchRef.current && !asSheet) return searchRef.current.focus({ preventScroll: true });
      const panel = panelRef.current;
      const target =
        panel?.querySelector<HTMLElement>(`${OPTION_SELECTOR}[aria-selected="true"]`) ??
        panel?.querySelector<HTMLElement>(OPTION_SELECTOR);
      target?.focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [open, asSheet]);

  const openList = () => {
    setQuery('');
    setAsSheet(window.matchMedia(SHEET_QUERY).matches);
    setOpen(true);
  };

  const choose = (next: Option) => {
    if (next.disabled) return;
    close();
    if (next.value === current) return;
    if (!isControlled) setInternal(next.value);
    if (nativeRef.current) commitToNative(nativeRef.current, next.value);
  };

  const needle = query.trim().toLowerCase();
  const visible = needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options;

  const focusOption = (move: 'next' | 'prev' | 'first' | 'last') => {
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) ?? []);
    if (items.length === 0) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next =
      move === 'first'
        ? 0
        : move === 'last'
          ? items.length - 1
          : move === 'next'
            ? Math.min(items.length - 1, i + 1)
            : Math.max(0, i - 1);
    items[next].focus();
  };

  const typeAhead = (key: string) => {
    const now = Date.now();
    const t = typeahead.current;
    t.text = now - t.at > TYPEAHEAD_RESET_MS ? key.toLowerCase() : t.text + key.toLowerCase();
    t.at = now;
    panelRef.current
      ?.querySelector<HTMLElement>(`${OPTION_SELECTOR}[data-select-label^="${CSS.escape(t.text)}"]`)
      ?.focus();
  };

  const onPanelKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      swallowEscape(e);
      close();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      close();
      return;
    }
    const move = MOVES[e.key];
    // Home/End belong to the search field's caret while typing in it.
    if (move && !(e.target === searchRef.current && (e.key === 'Home' || e.key === 'End'))) {
      e.preventDefault();
      focusOption(move);
      return;
    }
    if (!showSearch && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) typeAhead(e.key);
  };

  return (
    <div className="contents">
      <select
        ref={setNativeRef}
        {...nativeProps}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        // Constraint validation focuses the native element; hand that to the visible field.
        onFocus={(e) => {
          onFocus?.(e);
          triggerRef.current?.focus();
        }}
      >
        {optionNodes}
      </select>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        role="combobox"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={required || undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => {
          if (open && e.key === 'Escape') {
            swallowEscape(e);
            close();
          } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            openList();
          }
        }}
        className={cn(
          controlClasses,
          controlHeight,
          'flex items-center gap-2 pr-2.5 text-left',
          open && 'border-ink',
          className
        )}
      >
        <span className={cn('min-w-0 flex-1 truncate', (!selected || selected.value === '') && 'text-placeholder')}>
          {selected?.label ?? ''}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.5} aria-hidden="true" />
      </button>

      {open && (asSheet || placement) && (
        <Portal>
          <SelectPanel
            asSheet={asSheet}
            placement={placement}
            panelRef={panelRef}
            onPanelKey={onPanelKey}
            showSearch={showSearch}
            searchPlaceholder={searchPlaceholder}
            searchRef={searchRef}
            query={query}
            setQuery={setQuery}
            choose={choose}
            listId={listId}
            ariaLabel={ariaLabel}
            labelledBy={ariaLabelledBy ?? triggerId}
            visible={visible}
            current={current}
          />
        </Portal>
      )}
    </div>
  );
});
