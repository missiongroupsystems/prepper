import { Package, BookOpen, Plus, Trash2, Search, GripVertical } from 'lucide-react';
import { ThemeToggle } from '@/components/theme';
import { BrandSection } from './_sections/BrandSection';
import { ThemesSection } from './_sections/ThemesSection';
import { TokensSection } from './_sections/TokensSection';
import { TypeSection } from './_sections/TypeSection';
import { ComponentsSection } from './_sections/ComponentsSection';
import { Section } from './_sections/primitives';

const ICONS = [
  { icon: Package, name: 'Package' },
  { icon: BookOpen, name: 'BookOpen' },
  { icon: Plus, name: 'Plus' },
  { icon: Trash2, name: 'Trash2' },
  { icon: Search, name: 'Search' },
  { icon: GripVertical, name: 'GripVertical' },
] as const;

export default function DesignSystemPage() {
  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:p-6 md:p-8 lg:p-12">
        <header className="mb-12 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">Mission Systems</p>
            <h1 className="text-2xl font-medium text-foreground mb-2">Mission Recipes design system</h1>
            <p className="text-muted-foreground">
              Tokens, themes, type and brand — aligned with Mission Workforce.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <BrandSection />
        <ThemesSection />
        <TokensSection />
        <TypeSection />
        <ComponentsSection />

        <Section title="Icons">
          <p className="text-sm text-muted-foreground mb-4">
            Lucide React at 1.5 stroke. Sizes: size-4 (16px), size-5 (20px), size-6 (24px).
          </p>
          <div className="flex flex-wrap gap-6">
            {ICONS.map(({ icon: Icon, name }) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <Icon className="size-6 text-foreground" strokeWidth={1.5} />
                <span className="text-xs text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
