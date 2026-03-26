'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupplierIngredientsPaginated } from '@/lib/api';

export interface UseSupplierIngredientsPaginatedParams {
  page_number: number;
  page_size: number;
  search: string;
}

export function useSupplierIngredientsPaginated(params: UseSupplierIngredientsPaginatedParams) {
  return useQuery({
    queryKey: ['supplier-ingredients', 'paginated', params],
    queryFn: () =>
      getSupplierIngredientsPaginated({
        page_number: params.page_number,
        page_size: params.page_size,
        search: params.search || undefined,
      }),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}
