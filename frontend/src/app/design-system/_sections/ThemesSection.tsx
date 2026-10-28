import { Badge, Button, Input } from '@/components/ui';
import { BrandLogo } from '@/components/brand';
import { Section, Subsection } from './primitives';

/** One sample screen, rendered inside a `.light` or `.dark` scope regardless of the page theme. */
function ThemeSample({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div className={`${theme} flex flex-col gap-4 rounded-xl border border-border bg-background p-5 text-foreground`}>
      <div className="flex items-center justify-between">
        <BrandLogo variant="short" className="h-5 w-auto text-accent" />
        <span className="eyebrow capitalize">{theme}</span>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base text-foreground">Beef bourguignon</h3>
          <Badge variant="success">Approved</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Yield 10 portions · last costed today</p>
        <div className="flex items-baseline justify-between rounded-md bg-surface-sunken px-3 py-2">
          <span className="text-xs text-tertiary">Cost per portion</span>
          <span className="tnum text-sm font-medium">$4.82</span>
        </div>
        <Input placeholder="Add an ingredient…" />
        <div className="flex gap-2">
          <Button size="sm">Fork version</Button>
          <Button size="sm" variant="outline">Cost</Button>
          <Button size="sm" variant="ghost">Cancel</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="status-pending rounded-pill px-2 py-0.5 text-xs font-medium">Pending</span>
        <span className="status-attention rounded-pill px-2 py-0.5 text-xs font-medium">Attention</span>
        <span className="status-blocked rounded-pill px-2 py-0.5 text-xs font-medium">Blocked</span>
        <span className="status-alt rounded-pill px-2 py-0.5 text-xs font-medium">Alt</span>
      </div>
    </div>
  );
}

export function ThemesSection() {
  return (
    <Section title="Themes">
      <Subsection title="Both themes, side by side — pick System, Light or Dark at the top of the page">
        <div className="grid gap-4 md:grid-cols-2">
          <ThemeSample theme="light" />
          <ThemeSample theme="dark" />
        </div>
      </Subsection>
    </Section>
  );
}
