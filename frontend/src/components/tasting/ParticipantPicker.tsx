'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Badge, SearchInput } from '@/components/ui';
import { useUsers } from '@/lib/hooks';
import { User } from '@/types';

interface ParticipantPickerProps {
  selectedUsers: User[];
  onChange: (users: User[]) => void;
  disabled?: boolean;
  creatorId?: string;
  /** Id for the search field, so a `<Label htmlFor>` can name it. */
  inputId?: string;
}

export function ParticipantPicker({
  selectedUsers,
  onChange,
  disabled = false,
  creatorId,
  inputId,
}: ParticipantPickerProps) {
  const { data: allUsers = [] } = useUsers();
  const [query, setQuery] = useState('');

  const unselectedUsers = allUsers.filter(
    (u) => !selectedUsers.some((s) => s.id === u.id)
  );

  const filtered = query
    ? unselectedUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase())
      )
    : unselectedUsers;

  const addUser = (user: User) => {
    onChange([...selectedUsers, user]);
  };

  const removeUser = (userId: string) => {
    onChange(selectedUsers.filter((u) => u.id !== userId));
  };

  return (
    <div className="flex flex-col gap-2">
      {selectedUsers.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Attendees">
          {selectedUsers.map((user) => {
            const isCreator = user.id === creatorId;
            return (
              <li key={user.id}>
                <Badge className="gap-1 py-0.5 pr-1 text-[13px] text-ink">
                  {user.username}
                  {isCreator && <span className="text-tertiary">(organiser)</span>}
                  {!disabled && !isCreator && (
                    <button
                      type="button"
                      onClick={() => removeUser(user.id)}
                      aria-label={`Remove ${user.username}`}
                      className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-hover hover:text-ink max-sm:size-8"
                    >
                      <X className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  )}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}

      {!disabled && (
        <div className="relative">
          <SearchInput
            id={inputId}
            aria-label={inputId ? undefined : 'Add attendees'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery('')}
            placeholder="Add people by name or email…"
          />
          {query && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-popover py-1 text-popover-foreground shadow-pop">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">No people found</li>
              ) : (
                filtered.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => {
                        addUser(user);
                        setQuery('');
                      }}
                      className="flex min-h-10 w-full flex-wrap items-baseline gap-x-2 px-3 py-1.5 text-left text-sm hover:bg-surface-hover"
                    >
                      <span className="font-medium text-ink">{user.username}</span>
                      <span className="text-muted-foreground">{user.email}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
