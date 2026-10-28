'use client';

/** Ingredients → Products: every supplier product (an ingredient as one supplier sells it). */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import { useSupplierIngredientsPaginated, useDebouncedValue } from '@/lib/hooks';
import {
  EmptyState,
  Pagination,
  SearchInput,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { ListToolbar, TabHeader } from '@/components/lists/ListLayout';
import { formatDisplayName } from '@/lib/format/displayName';
import { TagsCell } from './TagsCell';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_ROWS = 5;
const COLUMNS = 7;

const money = new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 2 });

export function ProductsTab() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isLoading } = useSupplierIngredientsPaginated({
    page_number: page,
    page_size: PAGE_SIZE,
    search: debouncedSearch,
  });
  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <TabHeader title="Products" description="Every product your suppliers carry, with its pack price and tags." />
      <ListToolbar
        search={
          <SearchInput
            placeholder="Search by product name or SKU"
            aria-label="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
        }
      />

      {!isLoading && items.length === 0 && !debouncedSearch ? (
        <EmptyState
          icon={PackageSearch}
          title="No products yet"
          description="Link a supplier to an ingredient, or import a Buy Catalogue from the Ingredients tab."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table framed>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead numeric>Price per pack</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: SKELETON_ROWS }, (_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: COLUMNS }, (_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              {!isLoading && items.length === 0 && <TableEmpty colSpan={COLUMNS}>No products match your search.</TableEmpty>}
              {!isLoading &&
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="min-w-48">
                      <Link href={`/ingredients/${item.ingredient_id}`} className="font-medium hover:underline">
                        {item.ingredient_name ? formatDisplayName(item.ingredient_name) : '—'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.category_name ? formatDisplayName(item.category_name) : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">{item.sku ?? '—'}</TableCell>
                    <TableCell className="min-w-40">
                      <Link href={`/suppliers/${item.supplier_id}`} className="text-muted-foreground hover:underline">
                        {item.supplier_name ? formatDisplayName(item.supplier_name) : '—'}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <TagsCell siId={item.id} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                    <TableCell numeric className="font-medium">
                      {money.format(item.price_per_pack)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && (
        <Pagination
          pageNumber={data.page_number}
          totalPages={data.total_pages}
          totalCount={data.total_count}
          currentPageSize={data.current_page_size}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
