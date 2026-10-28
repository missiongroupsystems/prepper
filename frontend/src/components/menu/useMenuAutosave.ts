'use client';

/**
 * Debounced autosave for the menu builder. Every edit goes through `edit`, which updates the
 * draft and bumps a revision; a quiet `AUTOSAVE_DELAY_MS` later the whole draft is sent — POST
 * the first time (once it has a name and an outlet), PATCH after that. One request is in flight
 * at a time; edits made meanwhile are sent as soon as it lands, with the ids it returned.
 *
 * The draft lives in a ref as well as state so a follow-up save reads the reconciled ids
 * synchronously instead of waiting for a render.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCreateMenu, useUpdateMenu } from '@/lib/hooks';
import type { MenuDetail } from '@/types';
import { draftBlocker, draftFromMenu, draftPayload, emptyDraft, reconcileIds, type MenuDraft } from './menuDraft';

const AUTOSAVE_DELAY_MS = 800;

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export function useMenuAutosave(menu?: MenuDetail) {
  const createMenu = useCreateMenu();
  const updateMenu = useUpdateMenu();
  const { mutateAsync: create } = createMenu;
  const { mutateAsync: update } = updateMenu;

  const [draft, setDraft] = useState<MenuDraft>(() => (menu ? draftFromMenu(menu) : emptyDraft()));
  const [menuId, setMenuId] = useState<number | null>(menu?.id ?? null);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [revision, setRevision] = useState(0);

  const draftRef = useRef(draft);
  const menuIdRef = useRef(menuId);
  const revisionRef = useRef(0);
  const savedRevisionRef = useRef(0);
  const inFlightRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const edit = useCallback((change: (d: MenuDraft) => MenuDraft) => {
    const next = change(draftRef.current);
    draftRef.current = next;
    setDraft(next);
    revisionRef.current += 1;
    setRevision(revisionRef.current);
  }, []);

  const save = useCallback(async () => {
    if (inFlightRef.current || draftBlocker(draftRef.current)) return;
    inFlightRef.current = true;
    setStatus('saving');
    const sent = draftRef.current;
    const sentRevision = revisionRef.current;
    try {
      const saved =
        menuIdRef.current === null
          ? await create(draftPayload(sent))
          : await update({ menuId: menuIdRef.current, data: draftPayload(sent) });
      const reconciled = reconcileIds(draftRef.current, sent, saved);
      draftRef.current = reconciled;
      setDraft(reconciled);
      if (menuIdRef.current === null) {
        menuIdRef.current = saved.id;
        setMenuId(saved.id);
        // The builder stays mounted; only the address changes, so typing isn't interrupted.
        window.history.replaceState(null, '', `/menu/edit/${saved.id}`);
      }
      savedRevisionRef.current = sentRevision;
      setStatus(sentRevision === revisionRef.current ? 'saved' : 'pending');
    } catch {
      // The mutation hook has already toasted the error; the next edit retries.
      setStatus('error');
    } finally {
      inFlightRef.current = false;
    }
    if (savedRevisionRef.current !== revisionRef.current && !timerRef.current) void save();
  }, [create, update]);

  useEffect(() => {
    if (revision === 0) return;
    if (draftBlocker(draftRef.current)) {
      setStatus('idle');
      return;
    }
    setStatus((s) => (s === 'saving' ? s : 'pending'));
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void save();
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [revision, save]);

  // Leaving with an edit still waiting on the debounce: send it now rather than drop it.
  useEffect(
    () => () => {
      if (savedRevisionRef.current !== revisionRef.current) void save();
    },
    [save]
  );

  // A full reload can't wait for a request, so ask before throwing unsaved edits away.
  useEffect(() => {
    if (status !== 'pending' && status !== 'saving') return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [status]);

  return { draft, edit, menuId, status, blocker: draftBlocker(draft) };
}
