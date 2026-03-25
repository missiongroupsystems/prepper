'use client';

import { useMenuSketches, useCreateMenuSketch } from '@/lib/hooks';
import { formatDistanceToNow } from 'date-fns';
import { Plus, FileText, GitFork } from 'lucide-react';

export default function MenuSketchListPage() {
  const { data: sketches, isLoading } = useMenuSketches();
  const createSketch = useCreateMenuSketch();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Menu Sketches
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Freeform canvas for brainstorming menu layouts
            </p>
          </div>
          <button
            onClick={() => createSketch.mutate(undefined)}
            disabled={createSketch.isPending}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            <Plus className="h-4 w-4" />
            New Menu
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : !sketches || sketches.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-20 dark:border-zinc-700">
            <FileText className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              No sketches yet
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Create your first menu sketch to get started
            </p>
            <button
              onClick={() => createSketch.mutate(undefined)}
              disabled={createSketch.isPending}
              className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              <Plus className="h-4 w-4" />
              New Menu
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sketches.map((sketch) => (
              <a
                key={sketch.id}
                href={`/menu-sketch/${sketch.id}`}
                className="group relative flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {sketch.name}
                    </h3>
                    <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      <GitFork className="h-3 w-3" />
                      v{sketch.version}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
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
