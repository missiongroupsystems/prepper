import { Section, Subsection } from './primitives';

const SCALE = [
  { className: 'text-4xl', label: '36 / display' },
  { className: 'text-3xl', label: '30 / page title' },
  { className: 'text-2xl', label: '24 / section' },
  { className: 'text-xl', label: '20 / sub-section' },
  { className: 'text-lg', label: '18 / card title' },
  { className: 'text-base', label: '16 / emphasis' },
] as const;

export function TypeSection() {
  return (
    <Section title="Typography">
      <Subsection title="Families — Satoshi variable via the --brand-typeface-* seam; system mono">
        <div className="space-y-4">
          <div>
            <p className="font-sans text-2xl">Satoshi — body and UI, 400</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">font-sans · --brand-typeface-text</p>
          </div>
          <div>
            <p className="font-display text-2xl font-medium">Satoshi — headings, 500</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">font-display · --brand-typeface-display</p>
          </div>
          <div>
            <p className="font-mono text-base">SANC22 · POLR-NV · BAR019</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">font-mono · ui-monospace — IDs, SKUs, codes only</p>
          </div>
        </div>
      </Subsection>

      <Subsection title="Scale — headings 500, nothing bolder; hierarchy is size and colour">
        <div className="space-y-3">
          {SCALE.map(({ className, label }) => (
            <div key={className} className="flex items-baseline gap-4">
              <span className="w-32 shrink-0 font-mono text-xs text-muted-foreground">{label}</span>
              <p className={`${className} font-medium text-foreground`}>Braised short rib, celeriac</p>
            </div>
          ))}
          <div className="flex items-baseline gap-4">
            <span className="w-32 shrink-0 font-mono text-xs text-muted-foreground">14 / body</span>
            <p className="text-sm">Sear the beef in batches, then deglaze with red wine.</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="w-32 shrink-0 font-mono text-xs text-muted-foreground">12 / caption</span>
            <p className="text-xs text-tertiary">Last edited by Chef Lin, 2 hours ago</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="w-32 shrink-0 font-mono text-xs text-muted-foreground">eyebrow</span>
            <p className="eyebrow">Recipe canvas</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="w-32 shrink-0 font-mono text-xs text-muted-foreground">nav-eyebrow</span>
            <p className="nav-eyebrow">Workspace</p>
          </div>
        </div>
      </Subsection>

      <Subsection title="Text tiers">
        <div className="max-w-2xl space-y-2 text-sm">
          <p className="text-foreground">Primary — text-foreground (ink)</p>
          <p className="text-muted-foreground">Secondary — text-muted-foreground (muted deep)</p>
          <p className="text-tertiary">Tertiary — text-tertiary (muted)</p>
          <p className="text-disabled">Disabled — text-disabled (faded, never essential text)</p>
        </div>
      </Subsection>

      <Subsection title="Tabular numbers — tnum on money and every aligned figure">
        <div className="tnum w-32 text-right text-foreground">
          <p>$1,184.00</p>
          <p>$62,480.00</p>
          <p>$7.15</p>
        </div>
      </Subsection>
    </Section>
  );
}
