'use client';

/**
 * The searchable list of tasting sessions, upcoming first and past after. Used by /tastings and
 * by the Tastings tab of /rnd; the page around it supplies the header.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, History, Plus, Wine } from 'lucide-react';
import { useTastingSessions } from '@/lib/hooks/useTastings';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { Badge, EmptyState, Pagination, SearchInput, Skeleton, buttonClasses } from '@/components/ui';
import { useAppState } from '@/lib/store';
import type { TastingSession } from '@/types';
import { TastingSessionCard } from './TastingSessionCard';
import { isSessionExpired, toUtcDate } from './sessionDate';

const PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 300;
const CARD_GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

export function NewSessionLink({ label = 'New session' }: { label?: string }) {
  return (
    <Link href="/tastings/new" className={buttonClasses('primary', 'md')}>
      <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
      {label}
    </Link>
  );
}

function SessionGroup({
  icon: Icon,
  title,
  sessions,
  expired,
}: {
  icon: typeof Clock;
  title: string;
  sessions: TastingSession[];
  expired?: boolean;
}) {
  const { userId } = useAppState();
  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-base font-medium text-ink">
        <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
        {title}
        <Badge className="text-[13px] tabular-nums">{sessions.length}</Badge>
      </h2>
      <div className={CARD_GRID}>
        {sessions.map((session) => (
          <TastingSessionCard
            key={session.id}
            session={session}
            expired={expired}
            isOwn={!!(userId && session.creator_id === userId)}
            isInvited={!!(userId && session.participants?.some((p) => p.user_id === userId))}
          />
        ))}
      </div>
    </section>
  );
}

export function TastingSessionList() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [pageNumber, setPageNumber] = useState(1);
  useEffect(() => setPageNumber(1), [debouncedSearch]);

  const { data, isLoading, error } = useTastingSessions({
    page_size: PAGE_SIZE,
    page_number: pageNumber,
    search: debouncedSearch || undefined,
  });

  const { ongoingSessions, expiredSessions } = useMemo(() => {
    const ongoing: TastingSession[] = [];
    const expired: TastingSession[] = [];
    for (const session of data?.items ?? []) {
      (isSessionExpired(session.date) ? expired : ongoing).push(session);
    }
    ongoing.sort((a, b) => toUtcDate(a.date).getTime() - toUtcDate(b.date).getTime());
    expired.sort((a, b) => toUtcDate(b.date).getTime() - toUtcDate(a.date).getTime());
    return { ongoingSessions: ongoing, expiredSessions: expired };
  }, [data]);

  if (error) {
    return (
      <div role="alert" className="rounded-lg bg-danger-subtle p-4 text-sm text-danger">
        Failed to load tasting sessions. Please try again.
      </div>
    );
  }

  const hasNoSessions = ongoingSessions.length === 0 && expiredSessions.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="w-full sm:max-w-sm">
        <SearchInput
          aria-label="Search sessions"
          placeholder="Search sessions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
      </div>

      {isLoading && (
        <div className={CARD_GRID}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-44 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && hasNoSessions && (
        <EmptyState
          icon={Wine}
          title={search ? 'No sessions match your search' : 'No tasting sessions yet'}
          description="Create a tasting session to start tracking feedback on dishes."
          action={<NewSessionLink label="Create session" />}
        />
      )}

      {!isLoading && ongoingSessions.length > 0 && (
        <SessionGroup icon={Clock} title="Upcoming and today" sessions={ongoingSessions} />
      )}
      {!isLoading && expiredSessions.length > 0 && (
        <SessionGroup icon={History} title="Past sessions" sessions={expiredSessions} expired />
      )}

      {data && (
        <Pagination
          pageNumber={data.page_number}
          totalPages={data.total_pages}
          totalCount={data.total_count}
          currentPageSize={data.current_page_size}
          onPageChange={setPageNumber}
        />
      )}
    </div>
  );
}
