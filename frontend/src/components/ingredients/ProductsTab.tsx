'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSupplierIngredientsPaginated } from '@/lib/hooks';
import { useDebouncedValue } from '@/lib/hooks';
import { SearchInput, Skeleton } from '@/components/ui';
import { Pagination } from '@/components/ui/Pagination';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function ProductsTab() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading } = useSupplierIngredientsPaginated({
    page_number: page,
    page_size: 20,
    search: debouncedSearch,
  });

  const items = data?.items ?? [];

  return (
    <div className="h-full w-full overflow-auto">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 max-w-md">
          <SearchInput
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Product Name</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Category</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Supplier</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Unit</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">Price / Pack</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              )}

              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    {debouncedSearch ? 'No products match your search' : 'No products yet'}
                  </td>
                </tr>
              )}

              {!isLoading && items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/ingredients/${item.ingredient_id}`}
                      className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                    >
                      {item.ingredient_name ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {item.category_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {item.sku ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/suppliers/${item.supplier_id}`}
                      className="text-zinc-700 dark:text-zinc-300 hover:underline"
                    >
                      {item.supplier_name ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {item.unit}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(item.price_per_pack)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && (
          <div className="mt-4">
            <Pagination
              pageNumber={data.page_number}
              totalPages={data.total_pages}
              totalCount={data.total_count}
              currentPageSize={data.current_page_size}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
