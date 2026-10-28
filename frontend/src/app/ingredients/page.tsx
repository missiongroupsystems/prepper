'use client';

/**
 * Ingredients — the catalogue: products, the ingredient library, tags, suppliers and allergens.
 * One page shell (Page + SectionHeader) over a TabRail; each tab renders bare content. The
 * selected tab lives in app state so it survives a trip to a detail page and back.
 */
import { Page, SectionHeader } from '@/components/app';
import { TabRail } from '@/components/ui';
import { AllergensTab, CategoriesTab, IngredientsListTab, ProductsTab } from '@/components/ingredients';
import { SuppliersTab } from '@/components/suppliers';
import { useAppState, type IngredientTab } from '@/lib/store';

const INGREDIENT_TABS: { id: IngredientTab; label: string }[] = [
  { id: 'products', label: 'Products' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'categories', label: 'Tags' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'allergens', label: 'Allergens' },
];

const panelId = (id: IngredientTab) => `ingredients-panel-${id}`;

function TabContent({ tab }: { tab: IngredientTab }) {
  switch (tab) {
    case 'products':
      return <ProductsTab />;
    case 'categories':
      return <CategoriesTab />;
    case 'suppliers':
      return <SuppliersTab />;
    case 'allergens':
      return <AllergensTab />;
    case 'ingredients':
    default:
      return <IngredientsListTab />;
  }
}

export default function IngredientsPage() {
  const { ingredientTab, setIngredientTab } = useAppState();

  return (
    <Page>
      <SectionHeader
        eyebrow="Kitchen · Ingredients"
        title="Ingredients"
        description="What you buy, who you buy it from, and how it is tagged."
      />
      <TabRail
        label="Ingredient sections"
        items={INGREDIENT_TABS.map((t) => ({ ...t, panelId: panelId(t.id) }))}
        activeId={ingredientTab}
        onSelect={(id) => setIngredientTab(id as IngredientTab)}
      />
      <div id={panelId(ingredientTab)} role="tabpanel" aria-label={INGREDIENT_TABS.find((t) => t.id === ingredientTab)?.label}>
        <TabContent tab={ingredientTab} />
      </div>
    </Page>
  );
}
