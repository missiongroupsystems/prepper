'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  currentPageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ pageNumber, totalPages, totalCount, currentPageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (pageNumber - 1) * currentPageSize + 1;
  const end = Math.min(start + currentPageSize - 1, totalCount);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between border-t border-line px-2 py-3 text-sm">
      <span className="text-muted-foreground tabular-nums">
        {start}–{end} of {totalCount}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(pageNumber - 1)}
          disabled={pageNumber <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </Button>
        <span className="px-2 text-muted-foreground tabular-nums">
          {pageNumber} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(pageNumber + 1)}
          disabled={pageNumber >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
