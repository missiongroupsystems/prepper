'use client';

/**
 * ReferenceListView — the shared body of the reference-data tabs (ingredient tags, allergens,
 * dish categories, outlets): the tab header with its add action, a wrapping toolbar (search,
 * show archived, grid or list), then the loading, error, empty or filled state, and pagination.
 * The tab owns its queries and mutations and passes the results in.
 */
import type { ReactNode } from 'react';
import { Plus, type LucideIcon } from 'lucide-react';
import { Button, Checkbox, EmptyState, Pagination, SearchInput, ViewToggle } from '@/components/ui';
import { CardGrid, ListError, ListSkeleton, ListStack, ListToolbar, TabHeader } from './ListLayout';

export type ListView = 'grid' | 'list';

interface PageData {
  page_number: number;
  total_pages: number;
  total_count: number;
  current_page_size: number;
}

export interface ReferenceListViewProps<T> {
  title: string;
  description: string;
  /** Plural, lower case: "tags". */
  noun: string;
  icon: LucideIcon;
  /** One line under "No tags yet" saying what they are for. */
  emptyDescription?: string;
  /** Omit to hide the add action (read-only users). */
  onAdd?: () => void;
  addLabel: string;
  search: string;
  onSearchChange: (value: string) => void;
  showArchived: boolean;
  onShowArchivedChange: (value: boolean) => void;
  view: ListView;
  onViewChange: (view: ListView) => void;
  /** More toolbar controls, after "Show archived". */
  toolbarExtras?: ReactNode;
  items: T[];
  isLoading: boolean;
  error: unknown;
  renderItem: (item: T, view: ListView) => ReactNode;
  /** Replaces the flat grid or stack, e.g. with grouped sections. */
  renderBody?: (items: T[], view: ListView) => ReactNode;
  page?: PageData;
  onPageChange?: (page: number) => void;
  /** The add and edit panels and any confirm, rendered alongside. */
  children?: ReactNode;
}

export function ReferenceListView<T>(props: ReferenceListViewProps<T>) {
  const { title, description, noun, icon, onAdd, addLabel, search, items, isLoading, error, view } = props;

  const addButton = onAdd ? (
    <Button onClick={onAdd}>
      <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
      {addLabel}
    </Button>
  ) : undefined;

  const body = () => {
    if (error) return <ListError>Failed to load {noun}. Please try again.</ListError>;
    if (isLoading) return <ListSkeleton view={view} />;
    if (items.length === 0) {
      return search ? (
        <EmptyState icon={icon} title={`No ${noun} match your search`} description="Try a different word." />
      ) : (
        <EmptyState icon={icon} title={`No ${noun} yet`} description={props.emptyDescription} action={addButton} />
      );
    }
    if (props.renderBody) return props.renderBody(items, view);
    const rendered = items.map((item) => props.renderItem(item, view));
    return view === 'grid' ? <CardGrid>{rendered}</CardGrid> : <ListStack>{rendered}</ListStack>;
  };

  return (
    <div className="flex flex-col gap-6">
      <TabHeader title={title} description={description} actions={addButton} />
      <ListToolbar
        search={
          <SearchInput
            placeholder={`Search ${noun}`}
            aria-label={`Search ${noun}`}
            value={search}
            onChange={(e) => props.onSearchChange(e.target.value)}
            onClear={() => props.onSearchChange('')}
          />
        }
      >
        <Checkbox
          checked={props.showArchived}
          onChange={(e) => props.onShowArchivedChange(e.target.checked)}
          label="Show archived"
        />
        {props.toolbarExtras}
        <ViewToggle view={view} onViewChange={props.onViewChange} />
      </ListToolbar>
      {body()}
      {props.page && props.onPageChange && (
        <Pagination
          pageNumber={props.page.page_number}
          totalPages={props.page.total_pages}
          totalCount={props.page.total_count}
          currentPageSize={props.page.current_page_size}
          onPageChange={props.onPageChange}
        />
      )}
      {props.children}
    </div>
  );
}
