'use client';

import { User as UserIcon, Store } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { useUser } from '@/lib/hooks';
import { useOutlet } from '@/lib/hooks';
import { Skeleton } from '@/components/ui';

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
    <div>
      <p className="text-[11px] font-semibold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-1">
        {label}
      </p>
      <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        {children}
      </div>
    </div>
  );
}

export function UserProfileTab() {
  const { userId, username, email, userType, isManager, outletId } = useAppState();

  const { data: user, isLoading: userLoading } = useUser(userId);
  const { data: outlet, isLoading: outletLoading } = useOutlet(outletId);
  const { data: parentOutlet } = useOutlet(outlet?.parent_outlet_id ?? null);

  const roleLabel = userType === 'admin' ? 'Administrator' : 'Normal';
  const roleColor = userType === 'admin' ? 'bg-purple-500' : 'bg-blue-400';

  const outletSubline = [parentOutlet?.name, outlet?.code].filter(Boolean).join(' \u2022 ');

  return (
    <div className="h-full w-full overflow-auto">
      <div className="p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <UserIcon className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Account Information</h1>
          </div>
          {userLoading ? (
            <Skeleton className="h-4 w-32 rounded" />
          ) : user?.updated_at ? (
            <span className="text-sm text-zinc-400 dark:text-zinc-500">
              Last updated: {timeAgo(user.updated_at)}
            </span>
          ) : null}
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8">
          <Field label="Username">
            {userLoading ? <Skeleton className="h-5 w-28 rounded" /> : (username ?? '—')}
          </Field>

          <Field label="Email Address">
            {userLoading ? <Skeleton className="h-5 w-40 rounded" /> : (email ?? '—')}
          </Field>

          <Field label="Role">
            <span className="flex items-center gap-2">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${roleColor}`} />
              {roleLabel}
            </span>
          </Field>

          <Field label="Managerial Status">
            {`Manager: ${isManager ? 'Yes' : 'No'}`}
          </Field>
        </div>

        {/* Assigned Outlet */}
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-3">
            Assigned Outlet
          </p>

          {outletLoading ? (
            <Skeleton className="h-20 rounded-xl" />
          ) : outlet ? (
            <div className="flex items-center gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-5 py-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800">
                <Store className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{outlet.name}</p>
                {outletSubline && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{outletSubline}</p>
                )}
              </div>
              <button className="text-xs font-bold tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors uppercase">
                Change
              </button>
            </div>
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">No outlet assigned</p>
          )}
        </div>
      </div>
    </div>
  );
}
