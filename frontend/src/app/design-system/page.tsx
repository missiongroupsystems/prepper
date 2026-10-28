import { ThemeToggle } from '@/components/theme';
import { DesignSystemSections } from './_sections/DesignSystemSections';

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
        <DesignSystemSections />
      </div>
    </div>
  );
}
