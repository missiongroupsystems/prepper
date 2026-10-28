/**
 * Display-time name formatting for imported (mostly FoodMarketHub) data, which arrives in ALL
 * CAPS: `(100039) IQF STRAWBERRIES 1KG` → code `100039`, name `IQF strawberries 1kg`.
 *
 * Pure and display-only — stored names are never rewritten. Names someone typed in mixed case
 * pass through untouched. Workforce writes labels in plain sentence case, including after a
 * ` - ` or ` / ` separator ("Pension / provident"), so only the first letter is raised.
 */

/** A name is "shouting" when more than this share of its letters are upper case. */
export const SHOUTING_UPPERCASE_RATIO = 0.7;

/** Acronyms kept upper case when a shouting name is lowered. Explicit — never guessed by length. */
export const KNOWN_ACRONYMS: ReadonlySet<string> = new Set([
  'BBQ',
  'FB',
  'FMH',
  'GDI',
  'IQF',
  'LTD',
  'MSG',
  'PTE',
  'SKU',
  'UHT',
  'XO',
]);

/** Unit suffixes on a measure token (`1KG`, `12X500ML`) and how they display. */
export const UNIT_SUFFIX_DISPLAY: Readonly<Record<string, string>> = {
  KG: 'kg',
  G: 'g',
  GM: 'gm',
  MG: 'mg',
  L: 'L',
  LTR: 'ltr',
  ML: 'ml',
  CL: 'cl',
  OZ: 'oz',
  LB: 'lb',
  CM: 'cm',
  MM: 'mm',
  PC: 'pc',
  PCS: 'pcs',
};

export interface DisplayNameParts {
  /** Leading parenthesised code, e.g. an FMH item or supplier code, shown apart from the name. */
  code?: string;
  name: string;
}

const LETTER = /[A-Za-z]/g;
const UPPER_LETTER = /[A-Z]/g;
const DIGIT = /\d/;
const LEADING_CODE = /^\s*\(([A-Z0-9][A-Z0-9._/-]*)\)\s+(\S.*)$/;
const QUOTED_SEGMENT = /(["“][^"”]*["”])/;
const TOKEN_EDGES = /^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9]*)$/;
const MEASURE = new RegExp(
  `^(?:(\\d+)X)?(\\d+(?:\\.\\d+)?)(${Object.keys(UNIT_SUFFIX_DISPLAY).join('|')})$`
);
const FIRST_WORD_LETTER = /^([^A-Za-z0-9]*)([a-z])/;

export function isShouting(value: string): boolean {
  const letters = value.match(LETTER)?.length ?? 0;
  if (letters === 0) return false;
  const upper = value.match(UPPER_LETTER)?.length ?? 0;
  return upper / letters > SHOUTING_UPPERCASE_RATIO;
}

/** `1KG` → `1kg`, `12X500ML` → `12x500ml`; any other token with a digit is a code, kept as is. */
function formatMeasure(core: string): string {
  const match = MEASURE.exec(core);
  if (!match) return core;
  const [, packCount, amount, unit] = match;
  return `${packCount ? `${packCount}x` : ''}${amount}${UNIT_SUFFIX_DISPLAY[unit]}`;
}

function formatWord(core: string, titleCase: boolean): string {
  if (DIGIT.test(core)) return formatMeasure(core);
  if (KNOWN_ACRONYMS.has(core)) return core;
  const lower = core.toLowerCase();
  return titleCase ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
}

function formatSegment(segment: string, titleCase: boolean): string {
  return segment
    .split(/(\s+)/)
    .map((token) => {
      const [, before, core, after] = TOKEN_EDGES.exec(token) ?? ['', '', token, ''];
      return before + formatWord(core, titleCase) + after;
    })
    .join('');
}

/**
 * Sentence-cases a shouting name; anything else is returned unchanged. Quoted brand names are
 * title-cased (`"BEAUFOR"` → `"Beaufor"`), measures lowered (`1KG` → `1kg`), codes — including a
 * leading `(100039)` — and {@link KNOWN_ACRONYMS} kept.
 */
export function formatDisplayName(value: string): string {
  if (!isShouting(value)) return value;
  const leading = LEADING_CODE.exec(value);
  if (leading) return `(${leading[1]}) ${formatDisplayName(leading[2])}`;
  const lowered = value
    .split(QUOTED_SEGMENT)
    .map((segment) => formatSegment(segment, QUOTED_SEGMENT.test(segment)))
    .join('');
  return lowered.replace(FIRST_WORD_LETTER, (_, before: string, letter: string) => before + letter.toUpperCase());
}

/** Splits a leading code like `(100039)` off the name, then formats the name. */
export function displayNameParts(value: string): DisplayNameParts {
  const match = LEADING_CODE.exec(value);
  if (!match) return { name: formatDisplayName(value) };
  return { code: match[1], name: formatDisplayName(match[2]) };
}

/**
 * A supplier's own `code` is shown apart from the name. A leading code in the name is split off
 * only when it is that same code (or the supplier has none) — a different one stays in the name.
 */
export function supplierDisplayName(supplier: { name: string; code?: string | null }): DisplayNameParts {
  const parts = displayNameParts(supplier.name);
  if (!parts.code || parts.code === supplier.code) return { code: supplier.code || parts.code, name: parts.name };
  if (!supplier.code) return parts;
  return { code: supplier.code, name: `(${parts.code}) ${parts.name}` };
}
