/**
 * The menu builder's local draft: what the user is editing, with client keys so a row keeps its
 * identity (React key, drag id, open panel) before and after the server gives it an id.
 */
import type { MenuDetail } from '@/types';

export interface DraftItem {
  key: string;
  id?: number;
  recipe_id: number;
  recipe_name: string;
  display_price: number | null;
  additional_info: string | null;
  key_highlights: string | null;
  substitution: string | null;
}

export interface DraftSection {
  key: string;
  id?: number;
  name: string;
  items: DraftItem[];
}

export interface MenuDraft {
  name: string;
  is_published: boolean;
  outlet_ids: number[];
  sections: DraftSection[];
}

export type ItemTextField = 'key_highlights' | 'additional_info' | 'substitution';

let keySeq = 0;
export const newKey = (prefix: string) => `${prefix}-${++keySeq}`;

export function emptyDraft(): MenuDraft {
  return { name: '', is_published: false, outlet_ids: [], sections: [] };
}

export function draftFromMenu(menu: MenuDetail): MenuDraft {
  return {
    name: menu.name,
    is_published: menu.is_published,
    outlet_ids: (menu.outlets ?? []).map((o) => o.outlet_id),
    sections: menu.sections.map((s) => ({
      key: newKey('section'),
      id: s.id,
      name: s.name,
      items: s.items.map((i) => ({
        key: newKey('item'),
        id: i.id,
        recipe_id: i.recipe_id,
        recipe_name: i.recipe_name,
        display_price: i.display_price,
        additional_info: i.additional_info,
        key_highlights: i.key_highlights,
        substitution: i.substitution,
      })),
    })),
  };
}

/** The create / update body. Order is the array order, so `order_no` is always the index. */
export function draftPayload(draft: MenuDraft) {
  return {
    name: draft.name.trim(),
    is_published: draft.is_published,
    outlet_ids: draft.outlet_ids,
    sections: draft.sections.map((s, sIdx) => ({
      id: s.id,
      name: s.name,
      order_no: sIdx,
      items: s.items.map((i, iIdx) => ({
        id: i.id,
        recipe_id: i.recipe_id,
        order_no: iIdx,
        display_price: i.display_price,
        additional_info: i.additional_info,
        key_highlights: i.key_highlights,
        substitution: i.substitution,
      })),
    })),
  };
}

/** Why the draft can't be saved yet, or null when it can. */
export function draftBlocker(draft: MenuDraft): string | null {
  if (!draft.name.trim()) return 'Add a name to start saving';
  if (draft.outlet_ids.length === 0) return 'Pick at least one outlet to start saving';
  return null;
}

/**
 * Copy the server's ids onto the current draft. The response lists sections and items in the
 * order they were sent (both ordered by `order_no` = index), so the sent snapshot maps each key
 * to its id by position; the current draft may have moved on since, so ids are applied by key.
 */
export function reconcileIds(current: MenuDraft, sent: MenuDraft, saved: MenuDetail): MenuDraft {
  const ids = new Map<string, number>();
  sent.sections.forEach((s, sIdx) => {
    const savedSection = saved.sections[sIdx];
    if (!savedSection) return;
    ids.set(s.key, savedSection.id);
    s.items.forEach((i, iIdx) => {
      const savedItem = savedSection.items[iIdx];
      if (savedItem) ids.set(i.key, savedItem.id);
    });
  });
  return {
    ...current,
    sections: current.sections.map((s) => ({
      ...s,
      id: ids.get(s.key) ?? s.id,
      items: s.items.map((i) => ({ ...i, id: ids.get(i.key) ?? i.id })),
    })),
  };
}
