'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';

export function useSupplierIngredientTags() {
  return useQuery({
    queryKey: ['supplier-ingredient-tags'],
    queryFn: () => api.getSupplierIngredientTags(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSupplierIngredientTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createSupplierIngredientTag(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-ingredient-tags'] });
    },
  });
}

export function useDeleteSupplierIngredientTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: number) => api.deleteSupplierIngredientTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-ingredient-tags'] });
    },
  });
}

export function useTagsForSupplierIngredient(siId: number | null) {
  return useQuery({
    queryKey: ['supplier-ingredient-tags', 'for-si', siId],
    queryFn: () => api.getTagsForSupplierIngredient(siId!),
    enabled: siId !== null,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddTagToSupplierIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ siId, tagId }: { siId: number; tagId: number }) =>
      api.addTagToSupplierIngredient(siId, tagId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['supplier-ingredient-tags', 'for-si', variables.siId],
      });
    },
  });
}

export function useRemoveTagFromSupplierIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ siId, tagId }: { siId: number; tagId: number }) =>
      api.removeTagFromSupplierIngredient(siId, tagId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['supplier-ingredient-tags', 'for-si', variables.siId],
      });
    },
  });
}
