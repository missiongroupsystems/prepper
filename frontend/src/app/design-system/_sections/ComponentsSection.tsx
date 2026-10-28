'use client';

import { useState } from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Select,
  Textarea,
  Skeleton,
  SearchInput,
  PageHeader,
  GroupSection,
} from '@/components/ui';
import { BrandLogo } from '@/components/brand';
import { Section, Subsection } from './primitives';

/** The current ui/* primitives, as they render on the new tokens. Phase 2 restyles them. */
export function ComponentsSection() {
  const [searchValue, setSearchValue] = useState('');

  return (
    <>
      {/* Buttons */}
      <Section title="Buttons">
        <Subsection title="Variants">
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </Subsection>

        <Subsection title="Sizes">
          <div className="flex flex-wrap items-center gap-4">
            <Button size="lg">Large</Button>
            <Button size="default">Default</Button>
            <Button size="sm">Small</Button>
            <Button size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
        </Subsection>

        <Subsection title="With icons">
          <div className="flex flex-wrap gap-4">
            <Button>
              <Plus className="h-4 w-4" />
              New recipe
            </Button>
            <Button variant="outline">
              <Package className="h-4 w-4" />
              Add ingredient
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </Subsection>

        <Subsection title="States">
          <div className="flex flex-wrap gap-4">
            <Button>Enabled</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Subsection>
      </Section>

      {/* Badges */}
      <Section title="Badges">
        <Subsection title="Variants">
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </Subsection>

        <Subsection title="Recipe status examples">
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary">draft</Badge>
            <Badge variant="info">testing</Badge>
            <Badge variant="success">approved</Badge>
            <Badge variant="destructive">archived</Badge>
          </div>
        </Subsection>

        <Subsection title="Status label classes">
          <div className="flex flex-wrap gap-3">
            <span className="status-draft">Draft</span>
            <span className="status-testing">Testing</span>
            <span className="status-approved">Approved</span>
            <span className="status-archived">Archived</span>
            <span className="status-active">Active</span>
            <span className="status-inactive">Inactive</span>
          </div>
        </Subsection>

        <Subsection title="Inventory status">
          <div className="flex flex-wrap gap-3">
            <span className="status-optimal">Optimal</span>
            <span className="status-low">Low Stock</span>
            <span className="status-excess">Excess</span>
          </div>
        </Subsection>
      </Section>

      {/* Form Inputs */}
      <Section title="Form inputs">
        <div className="max-w-md space-y-6">
          <Subsection title="Text input">
            <Input placeholder="Enter recipe name..." />
          </Subsection>

          <Subsection title="Search input">
            <SearchInput
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onClear={() => setSearchValue('')}
              placeholder="Search ingredients..."
            />
          </Subsection>

          <Subsection title="Select">
            <Select
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'testing', label: 'Testing' },
                { value: 'approved', label: 'Approved' },
                { value: 'archived', label: 'Archived' },
              ]}
              defaultValue="draft"
            />
          </Subsection>

          <Subsection title="Textarea">
            <Textarea placeholder="Enter cooking instructions..." />
          </Subsection>

          <Subsection title="Input states">
            <div className="space-y-3">
              <Input placeholder="Normal input" />
              <Input placeholder="Disabled input" disabled />
            </div>
          </Subsection>
        </div>
      </Section>

      {/* Cards */}
      <Section title="Cards">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Card</CardTitle>
            </CardHeader>
            <CardContent>
              A simple card with just a title and content.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>With Description</CardTitle>
              <CardDescription>Supporting text goes here</CardDescription>
            </CardHeader>
            <CardContent>
              Cards can have descriptions for additional context.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>With Footer</CardTitle>
            </CardHeader>
            <CardContent>
              This card has a footer section for actions or metadata.
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
              <Button size="sm" variant="ghost">Cancel</Button>
            </CardFooter>
          </Card>

          <Card interactive>
            <CardHeader>
              <CardTitle>Interactive Card</CardTitle>
            </CardHeader>
            <CardContent>
              Hover over this card to see the lift effect.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BrandLogo variant="mark" className="size-5 text-accent" />
                <CardTitle>Recipe Card</CardTitle>
              </div>
              <Badge variant="success">approved</Badge>
            </CardHeader>
            <CardContent>
              <p>A recipe card example with icon and badge.</p>
              <p className="mt-2 text-xs text-muted-foreground">Yield: 10 portions</p>
            </CardContent>
            <CardFooter>
              <span className="text-sm text-muted-foreground">Cost:</span>
              <span className="tnum text-sm font-medium text-foreground ml-1">$12.50</span>
            </CardFooter>
          </Card>
        </div>
      </Section>

      {/* Skeletons */}
      <Section title="Loading states">
        <Subsection title="Skeleton">
          <div className="space-y-4 max-w-md">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          </div>
        </Subsection>

        <Subsection title="Card skeleton">
          <div className="max-w-sm">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/5" />
              </CardContent>
            </Card>
          </div>
        </Subsection>
      </Section>

      {/* Page Components */}
      <Section title="Page components">
        <Subsection title="Page header">
          <div className="rounded-lg border border-border p-4 bg-card">
            <PageHeader
              title="Ingredients Library"
              description="Manage your ingredient database and costs"
            >
              <Button>
                <Plus className="h-4 w-4" />
                Add ingredient
              </Button>
            </PageHeader>
          </div>
        </Subsection>

        <Subsection title="Group section">
          <div className="rounded-lg border border-border p-4 bg-card">
            <GroupSection title="Active ingredients" count={3}>
              <Card>
                <CardContent className="pt-4">Butter</CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">Flour</CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">Sugar</CardContent>
              </Card>
            </GroupSection>
          </div>
        </Subsection>
      </Section>
    </>
  );
}
