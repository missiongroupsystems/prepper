'use client';

import { useMenuSketches, useCreateMenuSketch } from '@/lib/hooks';
import { formatDistanceToNow } from 'date-fns';
import { Plus, FileText, GitFork } from 'lucide-react';
import { PageHeader, Button } from '@/components/ui';

export default function MenuSketchListPage() {
  const { data: sketches, isLoading } = useMenuSketches();
  const createSketch = useCreateMenuSketch();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <PageHeader
          title="Menu Sketches"
          description="Freeform canvas for brainstorming menu layouts"
        >
          <Button
            onClick={() => createSketch.mutate(undefined)}
            disabled={createSketch.isPending}
            size="sm"
          >
            <Plus className="h-4 w-4" />
            New Menu
          </Button>
        </PageHeader>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : !sketches || sketches.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No sketches yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Create your first menu sketch to get started
            </p>
            <Button
              onClick={() => createSketch.mutate(undefined)}
              disabled={createSketch.isPending}
              size="sm"
              className="mt-4"
            >
              <Plus className="h-4 w-4" />
              New Menu
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sketches.map((sketch) => (
              <a
                key={sketch.id}
                href={`/menu-sketch/${sketch.id}`}
                className="group relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-base font-semibold text-foreground">
                      {sketch.name}
                    </h3>
                    <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      <GitFork className="h-3 w-3" />
                      v{sketch.version}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updated{' '}
                    {formatDistanceToNow(new Date(sketch.updated_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
