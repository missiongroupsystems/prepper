import { test, expect } from '@playwright/test';
import { buildVersionGraph, VERSION_NODE_WIDTH } from './versionGraph';
import type { Recipe } from '@/types';

const COLORS = { edge: '#6b6962', grid: 'rgba(23, 23, 23, 0.16)' };

function recipe(id: number, version: number, rootId: number | null, name = `Recipe ${id}`): Recipe {
  return {
    id,
    name,
    version,
    root_id: rootId,
    status: 'draft',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    created_by: 'chef',
  } as Recipe;
}

test.describe('buildVersionGraph', () => {
  test('places each fork one level right of its parent', () => {
    const { nodes } = buildVersionGraph([recipe(1, 1, null), recipe(2, 2, 1), recipe(3, 3, 2)], 2, COLORS);
    const x = Object.fromEntries(nodes.map((n) => [n.id, n.position.x]));
    expect(x['1']).toBe(0);
    expect(x['2']).toBeGreaterThanOrEqual(VERSION_NODE_WIDTH);
    expect(x['3']).toBe(2 * x['2']);
  });

  test('marks the selected recipe as current', () => {
    const { nodes } = buildVersionGraph([recipe(1, 1, null), recipe(2, 2, 1)], 2, COLORS);
    expect(nodes.find((n) => n.id === '2')?.data.isCurrentRecipe).toBe(true);
    expect(nodes.find((n) => n.id === '1')?.data.isCurrentRecipe).toBe(false);
  });

  test('draws parent-to-fork edges in the token colour passed in', () => {
    const { edges } = buildVersionGraph([recipe(1, 1, null), recipe(2, 2, 1), recipe(3, 2, 1)], null, COLORS);
    expect(edges.map((e) => `${e.source}->${e.target}`)).toEqual(['1->2', '1->3']);
    for (const edge of edges) {
      expect(edge.style?.stroke).toBe(COLORS.edge);
      expect(edge.markerEnd).toMatchObject({ color: COLORS.edge });
    }
  });

  test('stacks sibling forks centred on the axis', () => {
    const { nodes } = buildVersionGraph([recipe(1, 1, null), recipe(2, 2, 1), recipe(3, 2, 1)], null, COLORS);
    const [a, b] = ['2', '3'].map((id) => nodes.find((n) => n.id === id)!.position.y);
    expect(a + b).toBe(0);
    expect(a).not.toBe(b);
  });

  test('leaves out masked versions and edges into them', () => {
    const { nodes, edges } = buildVersionGraph([recipe(1, 1, null), recipe(2, 2, 1, '')], null, COLORS);
    expect(nodes.map((n) => n.id)).toEqual(['1']);
    expect(edges).toEqual([]);
  });

  test('is empty when nothing is visible', () => {
    expect(buildVersionGraph([], null, COLORS)).toEqual({ nodes: [], edges: [] });
  });
});
