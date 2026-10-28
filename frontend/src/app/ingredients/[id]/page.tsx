'use client';

import { use } from 'react';
import { Archive, ArchiveRestore } from 'lucide-react';
import { toast } from 'sonner';
import { useDeactivateIngredient, useIngredient, useIngredientSuppliers, useUpdateIngredient } from '@/lib/hooks';
import { Page, SectionHeader } from '@/components/app';
import { Badge, Button, EntityCode } from '@/components/ui';
import { DetailLoadError, DetailSkeleton } from '@/components/catalogue';
import { displayNameParts } from '@/lib/format/displayName';
import type { UpdateIngredientRequest } from '@/types';
import { IngredientDetails } from './_components/IngredientDetails';
import { IngredientSuppliers } from './_components/IngredientSuppliers';
import { IngredientAllergens } from './_components/IngredientAllergens';

interface IngredientPageProps {
  params: Promise<{ id: string }>;
}

export default function IngredientPage({ params }: IngredientPageProps) {
  const { id } = use(params);
  const ingredientId = parseInt(id, 10);

  const { data: ingredient, isLoading, error } = useIngredient(ingredientId);
  const { data: links = [] } = useIngredientSuppliers(ingredientId);
  const updateIngredient = useUpdateIngredient();
  const deactivateIngredient = useDeactivateIngredient();

  if (error) {
    return (
      <Page>
        <DetailLoadError title="Ingredient not found" backHref="/ingredients" backLabel="Back to ingredients" />
      </Page>
    );
  }

  if (isLoading || !ingredient) {
    return (
      <Page>
        <DetailSkeleton />
      </Page>
    );
  }

  const { code, name } = displayNameParts(ingredient.name);

  const handleUpdate = (data: UpdateIngredientRequest) => {
    updateIngredient.mutate({ id: ingredientId, data }, { onError: () => toast.error('Failed to save the change') });
  };

  const handleArchive = () => {
    deactivateIngredient.mutate(ingredientId, {
      onSuccess: () => toast.success(`${name} archived`),
      onError: () => toast.error(`Failed to archive ${name}`),
    });
  };

  const handleUnarchive = () => {
    updateIngredient.mutate(
      { id: ingredientId, data: { is_active: true } },
      {
        onSuccess: () => toast.success(`${name} restored`),
        onError: () => toast.error(`Failed to restore ${name}`),
      }
    );
  };

  return (
    <Page>
      <SectionHeader
        eyebrow="Ingredient"
        title={name}
        description={code ? <EntityCode>{code}</EntityCode> : undefined}
        actions={
          <>
            <Badge variant={ingredient.is_active ? 'success' : 'warning'}>
              {ingredient.is_active ? 'Active' : 'Archived'}
            </Badge>
            {ingredient.is_active ? (
              <Button variant="secondary" onClick={handleArchive} disabled={deactivateIngredient.isPending}>
                <Archive className="size-4" strokeWidth={1.5} aria-hidden="true" />
                Archive
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleUnarchive} disabled={updateIngredient.isPending}>
                <ArchiveRestore className="size-4" strokeWidth={1.5} aria-hidden="true" />
                Restore
              </Button>
            )}
          </>
        }
      />
      <IngredientDetails ingredient={ingredient} links={links} onUpdate={handleUpdate} />
      <IngredientSuppliers ingredient={ingredient} links={links} />
      <IngredientAllergens ingredientId={ingredientId} />
    </Page>
  );
}
