import { test, expect } from '@playwright/test';
import type { MenuDetail } from '@/types';
import * as ops from './draftOps';
import { draftBlocker, draftPayload, emptyDraft, reconcileIds, type MenuDraft } from './menuDraft';

const STARTERS = { id: 1, name: 'Burrata' };
const MAINS = { id: 2, name: 'Duck' };
const DESSERT = { id: 3, name: 'Tart' };

function twoSectionDraft(): MenuDraft {
  let d: MenuDraft = { ...emptyDraft(), name: 'Dinner', outlet_ids: [7] };
  d = ops.addSection(ops.addSection(d));
  d = ops.addItems(d, d.sections[0].key, [STARTERS, MAINS]);
  return ops.addItems(d, d.sections[1].key, [DESSERT]);
}

/** What the API returns for a payload: ids for everything, in `order_no` order. */
function savedFrom(draft: MenuDraft, firstId: number): MenuDetail {
  let next = firstId;
  const payload = draftPayload(draft);
  return {
    id: 99,
    name: payload.name,
    is_published: payload.is_published,
    is_active: true,
    version_no: 1,
    created_by: 'u',
    created_at: '',
    updated_at: '',
    sections: payload.sections.map((s) => ({
      id: s.id ?? next++,
      name: s.name,
      menu_id: 99,
      order_no: s.order_no,
      items: s.items.map((i) => ({
        ...i,
        id: i.id ?? next++,
        section_id: 0,
        recipe_name: '',
        display_price: i.display_price,
        additional_info: i.additional_info,
        key_highlights: i.key_highlights,
        substitution: i.substitution,
      })),
    })),
  };
}

test.describe('draftBlocker', () => {
  test('needs a name, then an outlet', () => {
    expect(draftBlocker(emptyDraft())).toMatch(/name/);
    expect(draftBlocker({ ...emptyDraft(), name: '  ' })).toMatch(/name/);
    expect(draftBlocker({ ...emptyDraft(), name: 'Dinner' })).toMatch(/outlet/);
    expect(draftBlocker({ ...emptyDraft(), name: 'Dinner', outlet_ids: [1] })).toBeNull();
  });
});

test.describe('draftPayload', () => {
  test('order_no follows array order after a move', () => {
    let d = twoSectionDraft();
    const [a, b] = d.sections[0].items;
    d = ops.moveItem(d, d.sections[0].key, b.key, a.key);
    d = ops.moveSection(d, d.sections[1].key, d.sections[0].key);
    const payload = draftPayload(d);
    expect(payload.sections.map((s) => s.order_no)).toEqual([0, 1]);
    expect(payload.sections[1].items.map((i) => [i.recipe_id, i.order_no])).toEqual([
      [MAINS.id, 0],
      [STARTERS.id, 1],
    ]);
  });

  test('trims the name', () => {
    expect(draftPayload({ ...twoSectionDraft(), name: '  Dinner ' }).name).toBe('Dinner');
  });
});

test.describe('reconcileIds', () => {
  test('applies new ids by key, even after the draft moved on', () => {
    const sent = twoSectionDraft();
    const saved = savedFrom(sent, 100);
    // While the save was in flight: the sections swapped and a dish was added.
    let current = ops.moveSection(sent, sent.sections[1].key, sent.sections[0].key);
    current = ops.addItems(current, sent.sections[0].key, [DESSERT]);

    const next = reconcileIds(current, sent, saved);
    const starters = next.sections.find((s) => s.key === sent.sections[0].key)!;
    expect(starters.id).toBe(saved.sections[0].id);
    expect(starters.items.map((i) => i.id)).toEqual([
      saved.sections[0].items[0].id,
      saved.sections[0].items[1].id,
      undefined, // added after the save was sent; it gets an id on the next one
    ]);
    expect(next.sections.find((s) => s.key === sent.sections[1].key)!.id).toBe(saved.sections[1].id);
  });

  test('a second save sends ids, so nothing is created twice', () => {
    const sent = twoSectionDraft();
    const next = reconcileIds(sent, sent, savedFrom(sent, 100));
    const payload = draftPayload(next);
    expect(payload.sections.every((s) => s.id !== undefined)).toBe(true);
    expect(payload.sections.flatMap((s) => s.items).every((i) => i.id !== undefined)).toBe(true);
  });
});

test.describe('draftOps', () => {
  test('addItems skips dishes already on the section', () => {
    const d = twoSectionDraft();
    const next = ops.addItems(d, d.sections[0].key, [STARTERS, DESSERT]);
    expect(next.sections[0].items.map((i) => i.recipe_id)).toEqual([STARTERS.id, MAINS.id, DESSERT.id]);
  });

  test('removeItem then restoreItem puts the dish back where it was', () => {
    const d = twoSectionDraft();
    const section = d.sections[0];
    const removed = ops.removeItem(d, section.key, section.items[0].key);
    expect(removed.sections[0].items.map((i) => i.recipe_id)).toEqual([MAINS.id]);
    const restored = ops.restoreItem(removed, section.key, section.items[0], 0);
    expect(restored.sections[0].items.map((i) => i.recipe_id)).toEqual([STARTERS.id, MAINS.id]);
  });

  test('removeSection then restoreSection keeps its place and dishes', () => {
    const d = twoSectionDraft();
    const removed = ops.removeSection(d, d.sections[0].key);
    const restored = ops.restoreSection(removed, d.sections[0], 0);
    expect(restored.sections.map((s) => s.key)).toEqual(d.sections.map((s) => s.key));
  });

  test('toggleOutlet adds and removes without duplicates', () => {
    let d = emptyDraft();
    d = ops.toggleOutlet(d, 3, true);
    d = ops.toggleOutlet(d, 3, true);
    expect(d.outlet_ids).toEqual([3]);
    expect(ops.toggleOutlet(d, 3, false).outlet_ids).toEqual([]);
  });
});
