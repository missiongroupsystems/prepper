'use client';

/**
 * The R&D iteration history: every fork of the dish as a left-to-right tree that fills the space
 * it is given (the page is a `Page fill` workspace, so this is the only scroll area). Selecting a
 * version opens it on the same tab. Colours come from the live tokens, so it follows dark mode.
 */
import { memo, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ReactFlow, Background, Handle, Position, type NodeProps, type NodeMouseHandler } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Calendar, History, User } from 'lucide-react';
import { useTheme } from '@/components/theme';
import { Badge, EmptyState, Skeleton } from '@/components/ui';
import { formatDisplayName } from '@/lib/format/displayName';
import { cn } from '@/lib/utils';
import type { Recipe } from '@/types';
import { RecipeStatusBadge } from './recipeDisplay';
import { useTreeColors } from './useTreeColors';
import { buildVersionGraph, VERSION_NODE_WIDTH, type VersionNodeType } from './versionGraph';

const GRID_GAP = 16;
const SKELETON_NODE_COUNT = 3;
const HANDLE_CLASSES = '!size-2 !border-0 !bg-muted-foreground';

const VersionNode = memo(({ data }: NodeProps<VersionNodeType>) => {
  const { recipe, isCurrentRecipe } = data;
  const name = formatDisplayName(recipe.name);
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
        <p className="min-w-0 truncate font-medium text-ink" title={name}>
          {name}
        </p>
        <RecipeStatusBadge status={recipe.status} />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground tabular-nums">
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
        <p className="flex items-center gap-1 text-[13px] text-tertiary">
          <User className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          {recipe.created_by}
        </p>
      )}
      <Handle type="source" position={Position.Right} className={HANDLE_CLASSES} />
    </div>
  );
});
VersionNode.displayName = 'VersionNode';

const nodeTypes = { versionNode: VersionNode };

interface RndVersionTreeProps {
  recipeId: number;
  versions: Recipe[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function RndVersionTree({ recipeId, versions, isLoading, error }: RndVersionTreeProps) {
  const router = useRouter();
  const colors = useTreeColors();
  // ReactFlow stamps `light` / `dark` on its root, and both are theme scopes in tokens.css — so it
  // must be told the resolved theme, or its default `light` repaints the tree light in dark mode.
  const { resolvedTheme } = useTheme();

  const handleNodeClick: NodeMouseHandler<VersionNodeType> = useCallback(
    (_event, node) => router.push(`/rnd/r/${node.data.recipe.id}?tab=versions`),
    [router]
  );

  const { nodes, edges } = useMemo(
    () => buildVersionGraph(versions ?? [], recipeId, colors),
    [versions, recipeId, colors]
  );

  if (error) {
    return (
      <EmptyState bare icon={History} title="Failed to load version history" description="Reload the page to try again." />
    );
  }

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading" className="flex flex-wrap items-center gap-6 p-8">
        {Array.from({ length: SKELETON_NODE_COUNT }, (_, i) => (
          <div key={i} style={{ width: VERSION_NODE_WIDTH }}>
            <Skeleton className="h-28 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <EmptyState
        bare
        icon={History}
        title="No version history available"
        description="Fork this dish to start a version tree. Private versions you do not own are hidden."
      />
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      colorMode={resolvedTheme}
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
  );
}
