/** The builder's autosave state, in words, announced politely as it changes. */
import type { SaveStatus } from './useMenuAutosave';

const STATUS_TEXT: Record<SaveStatus, string> = {
  idle: 'Changes save automatically',
  pending: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'All changes saved',
  error: 'Couldn’t save — your next change will retry',
};

export function SaveIndicator({ status, blocker }: { status: SaveStatus; blocker: string | null }) {
  return (
    <span role="status" aria-live="polite" className={status === 'error' ? 'text-danger' : undefined}>
      {blocker ?? STATUS_TEXT[status]}
    </span>
  );
}
