'use client';

import { use } from 'react';
import { toast } from 'sonner';
import { useCategoryRecipes, useRecipeCategory, useRecipes, useUpdateRecipeCategory } from '@/lib/hooks';
import { Page, SectionHeader } from '@/components/app';
import { Card, EditableCell } from '@/components/ui';
import { DetailField, DetailList, DetailLoadError, DetailSkeleton, RecordTimestamps, inlineEditClasses } from '@/components/catalogue';
import { formatDisplayName } from '@/lib/format/displayName';
import type { UpdateRecipeCategoryRequest } from '@/types';
import { CategoryRecipes } from './_components/CategoryRecipes';

const LIST_PAGE_SIZE = 30;

interface RecipeCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default function RecipeCategoryPage({ params }: RecipeCategoryPageProps) {
  const { id } = use(params);
  const categoryId = parseInt(id, 10);

  const { data: category, isLoading, error } = useRecipeCategory(categoryId);
  const { data: links = [] } = useCategoryRecipes(categoryId);
  const { data: recipesData } = useRecipes({ page_size: LIST_PAGE_SIZE });
  const updateCategory = useUpdateRecipeCategory();

  if (error) {
    return (
      <Page>
        <DetailLoadError title="Category not found" backHref="/recipes" backLabel="Back to dishes" />
      </Page>
    );
  }

  if (isLoading || !category) {
    return (
      <Page>
        <DetailSkeleton />
      </Page>
    );
  }

  const name = formatDisplayName(category.name);

  const handleUpdate = (data: UpdateRecipeCategoryRequest) => {
    updateCategory.mutate({ id: categoryId, data }, { onError: () => toast.error('Failed to save the change') });
  };

  return (
    <Page>
      <SectionHeader eyebrow="Dish category" title={name} />
      <Card className="flex flex-col gap-5">
        <DetailList>
          <DetailField label="Name">
            <EditableCell
              value={category.name}
              displayValue={name}
              onSave={(value) => value.trim() && handleUpdate({ name: value.trim() })}
              className={inlineEditClasses}
            />
          </DetailField>
          <DetailField label="Description" wide>
            <EditableCell
              value={category.description || ''}
              placeholder="Add a description"
              onSave={(value) => handleUpdate({ description: value.trim() || null })}
              className={inlineEditClasses}
            />
          </DetailField>
        </DetailList>
        <RecordTimestamps createdAt={category.created_at} updatedAt={category.updated_at} />
      </Card>
      <CategoryRecipes categoryId={categoryId} categoryName={name} links={links} recipes={recipesData?.items ?? []} />
    </Page>
  );
}
