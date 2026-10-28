/** Settings → Design: the design-system showcase under the settings shell. */
import { ThemeToggle } from '@/components/theme';
import { TabHeader } from '@/components/lists/ListLayout';
import { DesignSystemSections } from '@/app/design-system/_sections/DesignSystemSections';

export function DesignSystemTab() {
  return (
    <div className="flex flex-col gap-6">
      <TabHeader
        title="Mission Recipes design system"
        description="Tokens, themes, type and brand — aligned with Mission Workforce."
        actions={<ThemeToggle />}
      />
      <div>
        <DesignSystemSections />
      </div>
    </div>
  );
}
