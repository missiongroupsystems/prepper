'use client';

/**
 * The menu-sketch list, shared by `/menu` and `/menu-sketch`: page head with the archive switch
 * and the create action, a card per sketch (the name links to the editor; a kebab holds the rest)
 * and an EmptyState when there are none.
 */
import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, MoreHorizontal, NotebookPen, Plus, Trash2 } from 'lucide-react';
import { Page, SectionHeader } from '@/components/app';
import { Badge, Button, Card, ConfirmModal, EmptyState, Menu, MenuItem, Skeleton, Switch } from '@/components/ui';
import { useCreateMenuSketch, useDeleteMenuSketch, useMenuSketches } from '@/lib/hooks';

const SKELETON_CARDS = 6;

/** The API sends naive UTC timestamps; read them as UTC. */
function parseUtc(timestamp: string): Date {
  const hasZone = timestamp.endsWith('Z') || timestamp.includes('+');
  return new Date(hasZone ? timestamp : `${timestamp}Z`);
}

export function SketchList({
  title,
  description,
  newSketchName,
}: {
  title: string;
  description: string;
  /** Name for a new sketch; the API's default when unset. */
  newSketchName?: string;
}) {
  const [showArchived, setShowArchived] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const { data: sketches, isLoading } = useMenuSketches({ include_archived: showArchived });
  const createSketch = useCreateMenuSketch();
  const deleteSketch = useDeleteMenuSketch();

  const newButton = (
    <Button onClick={() => createSketch.mutate(newSketchName)} loading={createSketch.isPending}>
      <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
      New sketch
    </Button>
  );

  return (
    <Page>
      <SectionHeader
        eyebrow="Kitchen · Menus"
        title={title}
        description={description}
        actions={
          <>
            <Switch checked={showArchived} onCheckedChange={setShowArchived} label="Show archived" />
            {newButton}
          </>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_CARDS }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : !sketches || sketches.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title={showArchived ? 'No sketches, archived or otherwise' : 'No menu sketches yet'}
          description="A sketch is a quick draft of a menu: sections, dishes and prices you can rearrange freely."
          action={newButton}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sketches.map((sketch) => {
            const name = sketch.name || 'Untitled';
            return (
              <li key={sketch.id}>
                <Card interactive className="relative flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="min-w-0 text-base leading-snug font-medium text-ink">
                      {/* Stretched link: the whole card opens the sketch; the kebab sits above it. */}
                      <Link
                        href={`/menu-sketch/${sketch.id}`}
                        className="line-clamp-2 break-words after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring"
                      >
                        {name}
                      </Link>
                    </h2>
                    <Menu
                      label={`${name} actions`}
                      className="relative z-10 -mt-1 -mr-2"
                      trigger={(props) => (
                        <Button variant="ghost" size="icon-sm" aria-label={`${name} actions`} {...props}>
                          <MoreHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
                        </Button>
                      )}
                    >
                      <MenuItem icon={ExternalLink} href={`/menu-sketch/${sketch.id}`}>
                        Open
                      </MenuItem>
                      <MenuItem icon={Trash2} danger onSelect={() => setDeleteTarget({ id: sketch.id, name })}>
                        Delete sketch
                      </MenuItem>
                    </Menu>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="neutral">v{sketch.version}</Badge>
                    {sketch.status === 'archived' && <Badge variant="neutral">Archived</Badge>}
                    <span>Updated {formatDistanceToNow(parseUtc(sketch.updated_at), { addSuffix: true })}</span>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete sketch"
        message={`Delete "${deleteTarget?.name}"? This can't be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            deleteSketch.mutate(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </Page>
  );
}
