'use client';

import { Plus } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Input, Switch } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Section } from './primitives';

/** The same primitives under a forced `.light` and `.dark` scope, side by side, whatever the page theme. */
function Sampler({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div className={cn(theme, 'rounded-xl bg-background p-5 text-foreground hairline')}>
      <p className="eyebrow mb-4">{theme === 'light' ? 'Light' : 'Dark'}</p>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm">
            <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Primary
          </Button>
          <Button size="sm" variant="secondary">
            Secondary
          </Button>
          <Button size="sm" variant="ghost">
            Ghost
          </Button>
          <Button size="sm" variant="danger">
            Danger
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge variant="settled">Settled</Badge>
          <Badge variant="pending">Pending</Badge>
          <Badge variant="attention">Attention</Badge>
          <Badge variant="blocked">Blocked</Badge>
        </div>
        <Input placeholder="Search recipes…" aria-label={`Sample field (${theme})`} />
        <div className="flex items-center gap-6">
          <Checkbox label="Archived" defaultChecked />
          <Switch label="Autosave" defaultChecked />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Brown butter</CardTitle>
            <span className="text-sm tabular-nums text-ink">$6.20</span>
          </CardHeader>
          <CardContent>Yield 1 kg · 4% wastage</CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ThemePairSection() {
  return (
    <Section title="Primitives in both themes">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Sampler theme="light" />
        <Sampler theme="dark" />
      </div>
    </Section>
  );
}
