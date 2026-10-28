import { Section, Subsection, SwatchGrid, TokenSwatch } from './primitives';

type Swatch = { token: string; label: string; utility: string };

const SURFACES: Swatch[] = [
  { token: '--background', label: 'Canvas', utility: 'bg-background' },
  { token: '--card', label: 'Panel / card', utility: 'bg-card' },
  { token: '--surface-sunken', label: 'Sunken', utility: 'bg-surface-sunken · bg-muted · bg-secondary' },
  { token: '--surface-hover', label: 'Hover', utility: 'bg-surface-hover' },
  { token: '--surface-active', label: 'Active', utility: 'bg-surface-active' },
  { token: '--surface-selected', label: 'Selected', utility: 'bg-surface-selected' },
];

const TEXT: Swatch[] = [
  { token: '--ink', label: 'Ink', utility: 'text-foreground · text-ink' },
  { token: '--muted-deep', label: 'Muted deep', utility: 'text-muted-foreground · text-muted-deep' },
  { token: '--muted', label: 'Muted', utility: 'text-tertiary' },
  { token: '--faded', label: 'Faded (disabled)', utility: 'text-disabled · text-faded' },
  { token: '--placeholder', label: 'Placeholder', utility: 'text-placeholder' },
];

const LINES_AND_ACCENT: Swatch[] = [
  { token: '--line', label: 'Line', utility: 'border-line' },
  { token: '--hairline', label: 'Hairline', utility: 'border-border · hairline' },
  { token: '--hairline-strong', label: 'Hairline strong', utility: 'border-hairline-strong' },
  { token: '--input', label: 'Control border', utility: 'border-input · border-control' },
  { token: '--accent', label: 'Accent (forest)', utility: 'bg-primary · bg-accent · text-accent' },
  { token: '--accent-press', label: 'Accent press', utility: 'bg-accent-press' },
  { token: '--accent-soft', label: 'Accent soft', utility: 'bg-accent-soft' },
  { token: '--ring', label: 'Focus ring', utility: 'ring-ring' },
];

const SEMANTIC = ['success', 'warning', 'info', 'danger'] as const;

const STATUS = [
  { className: 'status-draft', label: 'Draft' },
  { className: 'status-pending', label: 'Pending' },
  { className: 'status-settled', label: 'Settled' },
  { className: 'status-attention', label: 'Attention' },
  { className: 'status-blocked', label: 'Blocked' },
  { className: 'status-alt', label: 'Alt' },
] as const;

const RADII = [
  { utility: 'rounded-sm', size: '6px' },
  { utility: 'rounded-md', size: '8px' },
  { utility: 'rounded-lg', size: '12px' },
  { utility: 'rounded-xl', size: '16px' },
  { utility: 'rounded-pill', size: '999px' },
] as const;

function SwatchList({ items }: { items: Swatch[] }) {
  return (
    <SwatchGrid>
      {items.map((s) => (
        <TokenSwatch key={s.token} {...s} />
      ))}
    </SwatchGrid>
  );
}

export function TokensSection() {
  return (
    <Section title="Colour and shape tokens">
      <Subsection title="Surfaces">
        <SwatchList items={SURFACES} />
      </Subsection>

      <Subsection title="Text">
        <SwatchList items={TEXT} />
      </Subsection>

      <Subsection title="Lines and accent — the accent is the only brand colour">
        <SwatchList items={LINES_AND_ACCENT} />
      </Subsection>

      <Subsection title="Semantic — never signal state with colour alone">
        <SwatchGrid>
          {SEMANTIC.map((name) => (
            <div key={name} className="flex flex-col gap-2">
              <TokenSwatch token={`--${name}`} label={name} utility={`text-${name}`} />
              <TokenSwatch token={`--${name}-subtle`} label={`${name} subtle`} utility={`bg-${name}-subtle`} />
            </div>
          ))}
        </SwatchGrid>
      </Subsection>

      <Subsection title="Tier-2 status — utility status-* sets the tint and text pair">
        <div className="flex flex-wrap gap-3">
          {STATUS.map(({ className, label }) => (
            <span
              key={className}
              className={`${className} inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium`}
            >
              {label}
            </span>
          ))}
        </div>
      </Subsection>

      <Subsection title="Domain status pills">
        <div className="flex flex-wrap gap-3">
          <span className="status-draft">Draft</span>
          <span className="status-testing">Testing</span>
          <span className="status-approved">Approved</span>
          <span className="status-archived">Archived</span>
          <span className="status-active">Active</span>
          <span className="status-inactive">Inactive</span>
          <span className="status-optimal">Optimal</span>
          <span className="status-low">Low stock</span>
          <span className="status-excess">Excess</span>
        </div>
      </Subsection>

      <Subsection title="Radius — inputs 8, cards 12, floating panels 16, chips pill">
        <div className="flex flex-wrap gap-6">
          {RADII.map(({ utility, size }) => (
            <div key={utility} className="flex flex-col items-center gap-2">
              <div className={`size-16 border border-border bg-surface-sunken ${utility}`} />
              <span className="font-mono text-xs text-muted-foreground">{utility}</span>
              <span className="text-xs text-tertiary tnum">{size}</span>
            </div>
          ))}
        </div>
      </Subsection>
    </Section>
  );
}
