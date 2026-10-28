'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAddIngredientAllergen, useAllergens, useAllergensByIngredient, useDeleteIngredientAllergen } from '@/lib/hooks';
import { Button, Select, Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui';
import { ActionsHead } from '@/components/catalogue';

const COLUMN_COUNT = 3;

export function IngredientAllergens({ ingredientId }: { ingredientId: number }) {
  const { data: allergens = [] } = useAllergens();
  const { data: links = [] } = useAllergensByIngredient(ingredientId);
  const addAllergen = useAddIngredientAllergen();
  const deleteAllergen = useDeleteIngredientAllergen();
  const [selected, setSelected] = useState('');

  const linkedIds = new Set(links.map((l) => l.allergen_id));
  const available = allergens.filter((a) => a.is_active && !linkedIds.has(a.id));
  const rows = links.flatMap((link) => {
    const allergen = allergens.find((a) => a.id === link.allergen_id);
    return allergen ? [{ link, allergen }] : [];
  });

  const handleAdd = async () => {
    if (!selected) return;
    try {
      await addAllergen.mutateAsync({ ingredient_id: ingredientId, allergen_id: parseInt(selected, 10) });
      setSelected('');
      toast.success('Allergen added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add allergen');
    }
  };

  const handleRemove = (linkId: number, name: string) => {
    deleteAllergen.mutate(linkId, {
      onSuccess: () => toast.success(`${name} removed`),
      onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to remove allergen'),
    });
  };

  return (
    <section className="flex flex-col gap-3" aria-labelledby="ingredient-allergens">
      <h2 id="ingredient-allergens" className="text-lg">
        Allergens
      </h2>
      <Table framed>
        <TableHeader>
          <TableRow>
            <TableHead>Allergen</TableHead>
            <TableHead className="max-sm:hidden">Description</TableHead>
            <ActionsHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && <TableEmpty colSpan={COLUMN_COUNT}>No allergens recorded for this ingredient.</TableEmpty>}
          {rows.map(({ link, allergen }) => (
            <TableRow key={link.id}>
              <TableCell className="font-medium">{allergen.name}</TableCell>
              <TableCell className="text-muted-foreground max-sm:hidden">{allergen.description || '—'}</TableCell>
              <TableCell className="w-12 px-2 py-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(link.id, allergen.name)}
                  disabled={deleteAllergen.isPending}
                  aria-label={`Remove ${allergen.name}`}
                  className="text-muted-foreground"
                >
                  <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {available.length > 0 && (
        <div className="flex gap-2">
          <Select
            aria-label="Allergen to add"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            options={[
              { value: '', label: 'Select an allergen to add…' },
              ...available.map((a) => ({ value: String(a.id), label: a.name })),
            ]}
            className="flex-1"
          />
          <Button variant="secondary" onClick={handleAdd} disabled={!selected || addAllergen.isPending}>
            <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Add
          </Button>
        </div>
      )}
    </section>
  );
}
