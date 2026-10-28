'use client';

import Link from 'next/link';
import { ArrowUpRight, Plus, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  buttonClasses,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  GroupSection,
  PageHeader,
  PendingButton,
  type ButtonSize,
  type ButtonVariant,
} from '@/components/ui';
import { BrandLogo } from '@/components/brand';
import { Section, Subsection } from './primitives';
import { FormsSection } from './FormsSection';
import { DataSection } from './DataSection';
import { NavigationSection } from './NavigationSection';
import { OverlaysSection } from './OverlaysSection';
import { ThemePairSection } from './ThemePairSection';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];
const ICON = { className: 'size-4', strokeWidth: 1.5, 'aria-hidden': true } as const;

/**
 * Every ui/* primitive, variant, size and state. This file holds actions and surfaces; the
 * other groups live in their own section files and render from here, in reading order.
 */
export function ComponentsSection() {
  return (
    <>
      <ThemePairSection />
      <Section title="Buttons">
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
          Pills. One primary per view. Every size steps up to a 44px touch target below 640px (40px
          for <code className="font-mono text-xs">sm</code>). Old names still work:{' '}
          <code className="font-mono text-xs">default</code> → primary,{' '}
          <code className="font-mono text-xs">outline</code> → secondary,{' '}
          <code className="font-mono text-xs">destructive</code> → danger.
        </p>
        <Subsection title="Variants × sizes">
          <div className="space-y-3">
            {VARIANTS.map((variant) => (
              <div key={variant} className="flex flex-wrap items-center gap-3">
                <span className="w-20 text-xs text-tertiary">{variant}</span>
                {SIZES.map((size) => (
                  <Button key={size} variant={variant} size={size}>
                    {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
                  </Button>
                ))}
                <Button variant={variant} size="icon" aria-label="Add">
                  <Plus {...ICON} />
                </Button>
                <Button variant={variant} size="icon-sm" aria-label="Add">
                  <Plus {...ICON} />
                </Button>
              </div>
            ))}
          </div>
        </Subsection>

        <Subsection title="With icons">
          <div className="flex flex-wrap gap-3">
            <Button>
              <Plus {...ICON} />
              New recipe
            </Button>
            <Button variant="secondary" withArrow>
              Open costing
            </Button>
            <Button variant="danger">
              <Trash2 {...ICON} />
              Delete
            </Button>
          </div>
        </Subsection>

        <Subsection title="States">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Enabled</Button>
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
            <Button loading>Saving</Button>
            <PendingButton pending>Approve</PendingButton>
            <PendingButton pending={false} variant="secondary">
              Approve
            </PendingButton>
          </div>
        </Subsection>

        <Subsection title="buttonClasses() on a link">
          <Link href="/design-system" className={buttonClasses('secondary', 'md')}>
            Go to a page
            <ArrowUpRight {...ICON} />
          </Link>
        </Subsection>
      </Section>

      <Section title="Badges">
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
          The only place functional hues appear. Never the brand accent.
        </p>
        <Subsection title="Neutral and semantic">
          <div className="flex flex-wrap gap-3">
            <Badge>Neutral</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
          </div>
        </Subsection>
        <Subsection title="Status (Tier 2)">
          <div className="flex flex-wrap gap-3">
            <Badge variant="draft">Draft</Badge>
            <Badge variant="pending">Pending</Badge>
            <Badge variant="settled">Settled</Badge>
            <Badge variant="attention">Attention</Badge>
            <Badge variant="blocked">Blocked</Badge>
            <Badge variant="alt">Alt</Badge>
          </div>
        </Subsection>
        <Subsection title="Recipe domain classes">
          <div className="flex flex-wrap gap-3">
            <span className="status-draft">Draft</span>
            <span className="status-testing">Testing</span>
            <span className="status-approved">Approved</span>
            <span className="status-archived">Archived</span>
            <span className="status-inactive">Inactive</span>
            <span className="status-optimal">Optimal</span>
            <span className="status-low">Low stock</span>
            <span className="status-excess">Excess</span>
          </div>
        </Subsection>
      </Section>

      <Section title="Cards">
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
          Hairline, 12px radius, no shadow. Only things that float get a shadow.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Basic card</CardTitle>
            </CardHeader>
            <CardContent>A title and a line of content.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-1">
                <CardTitle>With description</CardTitle>
                <CardDescription>Supporting text goes here</CardDescription>
              </div>
            </CardHeader>
            <CardContent>Descriptions add context under the title.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>With footer</CardTitle>
            </CardHeader>
            <CardContent>A footer holds actions or metadata.</CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
              <Button size="sm" variant="ghost">
                Cancel
              </Button>
            </CardFooter>
          </Card>
          <Card interactive>
            <CardHeader>
              <CardTitle>Interactive card</CardTitle>
            </CardHeader>
            <CardContent>Hover: the hairline strengthens. Nothing moves.</CardContent>
          </Card>
          <Card sunken>
            <CardHeader>
              <CardTitle>Sunken tile</CardTitle>
            </CardHeader>
            <CardContent>For widgets and nested rows on a white ground.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BrandLogo variant="mark" className="size-5 text-accent" />
                <CardTitle>Beef bourguignon</CardTitle>
              </div>
              <Badge variant="settled">Approved</Badge>
            </CardHeader>
            <CardContent>Yield: 10 portions</CardContent>
            <CardFooter>
              <span className="text-sm text-muted-foreground">Cost per portion</span>
              <span className="ml-auto text-sm font-medium tabular-nums text-ink">$12.50</span>
            </CardFooter>
          </Card>
        </div>
      </Section>

      <Section title="Page components">
        <Subsection title="Page header">
          <div className="rounded-lg bg-card p-4 hairline">
            <PageHeader title="Ingredients library" description="Manage your ingredient database and costs">
              <Button>
                <Plus {...ICON} />
                Add ingredient
              </Button>
            </PageHeader>
          </div>
        </Subsection>
        <Subsection title="Group section">
          <div className="rounded-lg bg-card p-4 hairline">
            <GroupSection title="Active ingredients" count={3}>
              <Card>Butter</Card>
              <Card>Flour</Card>
              <Card>Sugar</Card>
            </GroupSection>
          </div>
        </Subsection>
      </Section>

      <FormsSection />
      <DataSection />
      <NavigationSection />
      <OverlaysSection />
    </>
  );
}
