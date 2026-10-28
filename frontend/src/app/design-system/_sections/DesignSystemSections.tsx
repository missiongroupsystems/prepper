import { Package, BookOpen, Plus, Trash2, Search, GripVertical } from 'lucide-react';
import { BrandSection } from './BrandSection';
import { ThemesSection } from './ThemesSection';
import { TokensSection } from './TokensSection';
import { TypeSection } from './TypeSection';
import { ComponentsSection } from './ComponentsSection';
import { Section } from './primitives';

const ICONS = [
  { icon: Package, name: 'Package' },
  { icon: BookOpen, name: 'BookOpen' },
  { icon: Plus, name: 'Plus' },
  { icon: Trash2, name: 'Trash2' },
  { icon: Search, name: 'Search' },
  { icon: GripVertical, name: 'GripVertical' },
] as const;

/** Every design-system section, without a page shell — for the route and for Settings → Design. */
export function DesignSystemSections() {
  return (
    <>
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
    </>
  );
}
