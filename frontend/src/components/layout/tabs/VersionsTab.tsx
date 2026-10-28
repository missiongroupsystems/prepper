'use client';

import { useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { ReactFlow, Background, Handle, Position, type NodeProps, type NodeMouseHandler } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Calendar, User, History } from 'lucide-react';
import { useRecipe, useRecipeVersions } from '@/lib/hooks';
import { useAppState } from '@/lib/store';
import { Page, SectionHeader } from '@/components/app';
import { Badge, EmptyState, Skeleton } from '@/components/ui';
import { RecipeTabState } from '@/components/recipe-tabs/RecipeTabPage';
import { useTreeColors } from '@/components/recipe-tabs/useTreeColors';
import {
  buildVersionGraph,
  VERSION_NODE_WIDTH,
  type VersionNodeType,
} from '@/components/recipe-tabs/versionGraph';
import { cn } from '@/lib/utils';
import type { RecipeStatus } from '@/types';

const STATUS_VARIANTS: Record<RecipeStatus, 'draft' | 'success' | 'warning'> = {
  draft: 'draft',
  active: 'success',
  archived: 'warning',
};

const GRID_GAP = 16;
const SKELETON_NODE_COUNT = 3;
const HANDLE_CLASSES = '!size-2 !border-0 !bg-muted-foreground';
/** Header strip: the shell's page gutters on the 1080px measure, so the title lines up with other tabs. */
const HEADER_MEASURE = 'mx-auto w-full max-w-(--content-max) px-5 pt-6 pb-4 sm:px-8 sm:pt-8 lg:px-12 lg:pt-10';

const VersionNode = memo(({ data }: NodeProps<VersionNodeType>) => {
  const { recipe, isCurrentRecipe } = data;
  return (
    <div
      style={{ width: VERSION_NODE_WIDTH }}
      className={cn(
        'flex cursor-pointer flex-col gap-1.5 rounded-lg bg-card p-4 transition-colors duration-(--dur-quick)',
        isCurrentRecipe ? 'border border-accent' : 'hairline hover:border-hairline-strong'
      )}
    >
      <Handle type="target" position={Position.Left} className={HANDLE_CLASSES} />
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate font-medium text-ink" title={recipe.name}>
          {recipe.name}
        </p>
        <Badge variant={STATUS_VARIANTS[recipe.status]} className="shrink-0 capitalize">
          {recipe.status}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-muted-foreground">
        <span className="flex items-center gap-1">
          <History className="size-3.5" strokeWidth={1.5} aria-hidden="true" />v{recipe.version}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          {new Date(recipe.created_at).toLocaleDateString('en-GB')}
        </span>
        {isCurrentRecipe && <Badge variant="info">Current</Badge>}
      </div>
      {recipe.created_by && (
        <p className="flex items-center gap-1 text-xs text-tertiary">
          <User className="size-3" strokeWidth={1.5} aria-hidden="true" />
          {recipe.created_by}
        </p>
      )}
      <Handle type="source" position={Position.Right} className={HANDLE_CLASSES} />
    </div>
  );
});
VersionNode.displayName = 'VersionNode';

const nodeTypes = { versionNode: VersionNode };

function VersionTreeSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-6 p-8">
      {Array.from({ length: SKELETON_NODE_COUNT }, (_, i) => (
        <div key={i} style={{ width: VERSION_NODE_WIDTH }}>
          <Skeleton className="h-28 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function VersionsTab() {
  const router = useRouter();
  const { selectedRecipeId, userId } = useAppState();
  const { data: versions, isLoading, error } = useRecipeVersions(selectedRecipeId, userId);
  const { data: recipe } = useRecipe(selectedRecipeId);
  const colors = useTreeColors();

  const handleNodeClick: NodeMouseHandler<VersionNodeType> = useCallback(
    (_event, node) => router.push(`/?recipe=${node.data.recipe.id}`),
    [router]
  );

  const { nodes, edges } = useMemo(
    () => buildVersionGraph(versions ?? [], selectedRecipeId, colors),
    [versions, selectedRecipeId, colors]
  );

  const subject = 'its version history';
  if (!selectedRecipeId) return <RecipeTabState state="unselected" subject={subject} icon={History} />;
  if (error) return <RecipeTabState state="error" subject={subject} icon={History} />;

  // Versions the user may not see come back masked and are not drawn, so count what is drawn.
  const count = nodes.length;
  return (
    <Page fill>
      <div className={HEADER_MEASURE}>
        <SectionHeader
          eyebrow={recipe?.name}
          title="Versions"
          description="Every fork of this recipe. Select a version to open it."
          actions={count > 0 && <Badge>{count === 1 ? '1 version' : `${count} versions`}</Badge>}
        />
      </div>
      <div className="min-h-[400px] flex-1 border-t border-line">
        {isLoading && <VersionTreeSkeleton />}
        {!isLoading && count === 0 && (
          <EmptyState
            bare
            icon={History}
            title="No versions to show"
            description="Fork this recipe to start a version tree. Private versions you do not own are hidden."
          />
        )}
        {!isLoading && count > 0 && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            defaultViewport={{ x: 48, y: 200, zoom: 1 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            panOnScroll
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            minZoom={1}
            maxZoom={1}
            proOptions={{ hideAttribution: true }}
          >
            <Background color={colors.grid} gap={GRID_GAP} />
          </ReactFlow>
        )}
      </div>
    </Page>
  );
}
