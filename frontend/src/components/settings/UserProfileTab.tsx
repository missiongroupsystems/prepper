'use client';

import { Store } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { useUser, useOutlet } from '@/lib/hooks';
import { Card, Skeleton } from '@/components/ui';
import { TabHeader } from '@/components/lists/ListLayout';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line pb-3">
      <dt className="text-[13px] font-medium text-muted-foreground">{label}</dt>
      <dd className="text-base text-ink">{children}</dd>
    </div>
  );
}

export function UserProfileTab() {
  const { userId, username, email, userType, isManager, outletId } = useAppState();

  const { data: user, isLoading: userLoading } = useUser(userId);
  const { data: outlet, isLoading: outletLoading } = useOutlet(outletId);
  const { data: parentOutlet } = useOutlet(outlet?.parent_outlet_id ?? null);

  const roleLabel = userType === 'admin' ? 'Administrator' : 'Normal';
  const outletSubline = [parentOutlet?.name, outlet?.code].filter(Boolean).join(' · ');

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <TabHeader
        title="Account"
        description="Who you are signed in as, and the outlet your access is scoped to."
        actions={
          userLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : user?.updated_at ? (
            <span className="text-sm text-tertiary">Last updated {timeAgo(user.updated_at)}</span>
          ) : undefined
        }
      />

      <dl className="grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2">
        <Field label="Username">{userLoading ? <Skeleton className="h-5 w-28" /> : (username ?? '—')}</Field>
        <Field label="Email address">{userLoading ? <Skeleton className="h-5 w-40" /> : (email ?? '—')}</Field>
        <Field label="Role">{roleLabel}</Field>
        <Field label="Manager">{isManager ? 'Yes' : 'No'}</Field>
      </dl>

      <section className="flex flex-col gap-3">
        <h3 className="text-[13px] font-medium text-muted-foreground">Assigned outlet</h3>
        {outletLoading ? (
          <Skeleton className="h-20 rounded-lg" />
        ) : outlet ? (
          <Card className="flex items-center gap-4 px-5 py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-surface-sunken text-tertiary">
              <Store className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{outlet.name}</p>
              {outletSubline && <p className="text-sm text-muted-foreground">{outletSubline}</p>}
            </div>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">No outlet assigned. An admin can assign one under Users.</p>
        )}
      </section>
    </div>
  );
}
