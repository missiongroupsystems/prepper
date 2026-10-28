/**
 * Lays a recipe's versions out as a left-to-right tree for ReactFlow: the original at level 0,
 * each fork (`root_id` is "forked from") one level right of its parent, siblings stacked and
 * centred on the axis. Masked (private) versions arrive with an empty name and are left out.
 */
import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { Recipe } from '@/types';
import type { TreeColors } from './useTreeColors';

export interface VersionNodeData extends Record<string, unknown> {
  recipe: Recipe;
  isCurrentRecipe: boolean;
}

export type VersionNodeType = Node<VersionNodeData, 'versionNode'>;

/** The node card's width — the card is sized from this so the layout and the card agree. */
export const VERSION_NODE_WIDTH = 256;
const NODE_HEIGHT = 112;
const HORIZONTAL_SPACING = 72;
const VERTICAL_SPACING = 32;
const EDGE_STROKE_WIDTH = 1.5;
const MARKER_SIZE = 18;

/** Breadth-first from the root, so each version's level is its distance from the original. */
function assignLevels(versions: Recipe[], byId: Map<number, Recipe>): Map<number, Recipe[]> {
  const children = new Map<number, Recipe[]>();
  for (const recipe of versions) {
    if (recipe.root_id === null || !byId.has(recipe.root_id)) continue;
    children.set(recipe.root_id, [...(children.get(recipe.root_id) ?? []), recipe]);
  }

  const root =
    versions.find((recipe) => recipe.root_id === null) ?? [...versions].sort((a, b) => a.version - b.version)[0];
  const levels = new Map<number, Recipe[]>();
  const place = (recipe: Recipe, level: number) => levels.set(level, [...(levels.get(level) ?? []), recipe]);

  const visited = new Set<number>();
  const queue: { recipe: Recipe; level: number }[] = [{ recipe: root, level: 0 }];
  while (queue.length > 0) {
    const { recipe, level } = queue.shift()!;
    if (visited.has(recipe.id)) continue;
    visited.add(recipe.id);
    place(recipe, level);
    const forks = [...(children.get(recipe.id) ?? [])].sort((a, b) => a.version - b.version);
    for (const fork of forks) if (!visited.has(fork.id)) queue.push({ recipe: fork, level: level + 1 });
  }

  // Versions whose parent is hidden: fall back to the version number for the level.
  for (const recipe of versions) if (!visited.has(recipe.id)) place(recipe, recipe.version - 1);
  return levels;
}

export function buildVersionGraph(
  versions: Recipe[],
  selectedRecipeId: number | null,
  colors: TreeColors
): { nodes: VersionNodeType[]; edges: Edge[] } {
  const visible = versions.filter((recipe) => recipe.name !== '');
  if (!visible.length) return { nodes: [], edges: [] };

  const byId = new Map(visible.map((recipe) => [recipe.id, recipe]));
  const positions = new Map<number, { x: number; y: number }>();
  for (const [level, recipes] of assignLevels(visible, byId)) {
    const totalHeight = recipes.length * NODE_HEIGHT + (recipes.length - 1) * VERTICAL_SPACING;
    const startY = -totalHeight / 2 + NODE_HEIGHT / 2;
    recipes.forEach((recipe, index) => {
      positions.set(recipe.id, {
        x: level * (VERSION_NODE_WIDTH + HORIZONTAL_SPACING),
        y: startY + index * (NODE_HEIGHT + VERTICAL_SPACING),
      });
    });
  }

  const nodes: VersionNodeType[] = visible.map((recipe) => ({
    id: String(recipe.id),
    type: 'versionNode',
    position: positions.get(recipe.id) ?? { x: 0, y: 0 },
    data: { recipe, isCurrentRecipe: recipe.id === selectedRecipeId },
    draggable: false,
    selectable: false,
  }));

  const edges: Edge[] = visible
    .filter((recipe) => recipe.root_id !== null && byId.has(recipe.root_id))
    .map((recipe) => ({
      id: `e${recipe.root_id}-${recipe.id}`,
      source: String(recipe.root_id),
      target: String(recipe.id),
      type: 'smoothstep',
      style: { stroke: colors.edge, strokeWidth: EDGE_STROKE_WIDTH },
      markerEnd: { type: MarkerType.ArrowClosed, color: colors.edge, width: MARKER_SIZE, height: MARKER_SIZE },
    }));

  return { nodes, edges };
}
