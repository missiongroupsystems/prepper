/** Pure edits on a MenuDraft — each returns a new draft, so they compose with `edit`. */
import { arrayMove } from '@dnd-kit/sortable';
import { newKey, type DraftItem, type DraftSection, type MenuDraft } from './menuDraft';

export interface PickedRecipe {
  id: number;
  name: string;
}

function mapSection(draft: MenuDraft, sectionKey: string, change: (s: DraftSection) => DraftSection): MenuDraft {
  return { ...draft, sections: draft.sections.map((s) => (s.key === sectionKey ? change(s) : s)) };
}

function insertAt<T>(list: T[], index: number, value: T): T[] {
  const next = [...list];
  next.splice(Math.min(index, next.length), 0, value);
  return next;
}

export function addSection(draft: MenuDraft): MenuDraft {
  const section: DraftSection = { key: newKey('section'), name: `Section ${draft.sections.length + 1}`, items: [] };
  return { ...draft, sections: [...draft.sections, section] };
}

export function renameSection(draft: MenuDraft, sectionKey: string, name: string): MenuDraft {
  return mapSection(draft, sectionKey, (s) => ({ ...s, name }));
}

export function removeSection(draft: MenuDraft, sectionKey: string): MenuDraft {
  return { ...draft, sections: draft.sections.filter((s) => s.key !== sectionKey) };
}

export function restoreSection(draft: MenuDraft, section: DraftSection, index: number): MenuDraft {
  return { ...draft, sections: insertAt(draft.sections, index, section) };
}

export function moveSection(draft: MenuDraft, activeKey: string, overKey: string): MenuDraft {
  const from = draft.sections.findIndex((s) => s.key === activeKey);
  const to = draft.sections.findIndex((s) => s.key === overKey);
  if (from < 0 || to < 0) return draft;
  return { ...draft, sections: arrayMove(draft.sections, from, to) };
}

/** Adds the picked recipes to a section, skipping any already on it. */
export function addItems(draft: MenuDraft, sectionKey: string, recipes: PickedRecipe[]): MenuDraft {
  return mapSection(draft, sectionKey, (s) => {
    const present = new Set(s.items.map((i) => i.recipe_id));
    const added: DraftItem[] = recipes
      .filter((r) => !present.has(r.id))
      .map((r) => ({
        key: newKey('item'),
        recipe_id: r.id,
        recipe_name: r.name,
        display_price: null,
        additional_info: null,
        key_highlights: null,
        substitution: null,
      }));
    return { ...s, items: [...s.items, ...added] };
  });
}

export function updateItem(
  draft: MenuDraft,
  sectionKey: string,
  itemKey: string,
  patch: Partial<DraftItem>
): MenuDraft {
  return mapSection(draft, sectionKey, (s) => ({
    ...s,
    items: s.items.map((i) => (i.key === itemKey ? { ...i, ...patch } : i)),
  }));
}

export function removeItem(draft: MenuDraft, sectionKey: string, itemKey: string): MenuDraft {
  return mapSection(draft, sectionKey, (s) => ({ ...s, items: s.items.filter((i) => i.key !== itemKey) }));
}

export function restoreItem(draft: MenuDraft, sectionKey: string, item: DraftItem, index: number): MenuDraft {
  return mapSection(draft, sectionKey, (s) => ({ ...s, items: insertAt(s.items, index, item) }));
}

export function moveItem(draft: MenuDraft, sectionKey: string, activeKey: string, overKey: string): MenuDraft {
  return mapSection(draft, sectionKey, (s) => {
    const from = s.items.findIndex((i) => i.key === activeKey);
    const to = s.items.findIndex((i) => i.key === overKey);
    if (from < 0 || to < 0) return s;
    return { ...s, items: arrayMove(s.items, from, to) };
  });
}

export function toggleOutlet(draft: MenuDraft, outletId: number, on: boolean): MenuDraft {
  const others = draft.outlet_ids.filter((id) => id !== outletId);
  return { ...draft, outlet_ids: on ? [...others, outletId] : others };
}
