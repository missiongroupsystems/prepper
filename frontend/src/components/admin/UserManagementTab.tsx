'use client';

/**
 * Settings → Admin: every user, with their phone, manager flag and outlet edited in place
 * (autosave). Admins see every outlet, so their manager and outlet cells are not editable.
 */
import { useMemo, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  EditableCell,
  EmptyState,
  SearchInput,
  Select,
  SkeletonRows,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { ListError, ListToolbar, TabHeader } from '@/components/lists/ListLayout';
import { useUsers, useUpdateUser, useOutlets } from '@/lib/hooks';
import type { User } from '@/types';
import { AddUserModal } from './AddUserModal';

const LOOKUP_PAGE_SIZE = 30;

export function UserManagementTab() {
  const [search, setSearch] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const updateUser = useUpdateUser();
  const { data: users, isLoading, error } = useUsers();
  const { data: outletsData } = useOutlets({ page_size: LOOKUP_PAGE_SIZE });
  const outletOptions = useMemo(
    () => [{ value: '', label: 'None' }, ...(outletsData?.items ?? []).map((o) => ({ value: o.id.toString(), label: o.name }))],
    [outletsData]
  );

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const needle = search.toLowerCase();
    if (!needle) return users;
    return users.filter((user) => user.username.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle));
  }, [users, search]);

  const save = (user: User, data: Partial<User>, success: string) => {
    updateUser.mutate(
      { userId: user.id, data },
      {
        onSuccess: () => toast.success(success),
        onError: () => toast.error('Failed to update user'),
      }
    );
  };

  const addUser = (
    <Button onClick={() => setIsAddUserModalOpen(true)}>
      <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
      Add user
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <TabHeader title="Users" description="Roles, managers and the outlet each person works in." actions={addUser} />
      <AddUserModal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} />

      <ListToolbar
        search={
          <SearchInput
            placeholder="Search by username or email"
            aria-label="Search users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
        }
      />

      {error ? (
        <ListError>Failed to load users. Please try again.</ListError>
      ) : isLoading ? (
        <SkeletonRows rows={5} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No users match your search' : 'No users yet'}
          description={search ? 'Try a different name or email.' : 'Add the people who cook and manage here.'}
          action={search ? undefined : addUser}
        />
      ) : (
        <div className="overflow-x-auto">
          <Table framed>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Outlet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const isAdmin = user.user_type === 'admin';
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="min-w-40">
                      <EditableCell
                        value={user.phone_number ?? ''}
                        placeholder="Add phone"
                        onSave={(phone) => save(user, { phone_number: phone || null }, 'Phone number updated')}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={isAdmin ? 'info' : 'neutral'}>{isAdmin ? 'Admin' : 'Normal'}</Badge>
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <span className="text-tertiary">—</span>
                      ) : (
                        <Switch
                          checked={user.is_manager}
                          aria-label={`${user.username} is a manager`}
                          disabled={updateUser.isPending}
                          onCheckedChange={(isManager) =>
                            save(user, { is_manager: isManager }, isManager ? 'Manager status granted' : 'Manager status revoked')
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell className="min-w-48">
                      {isAdmin ? (
                        <span className="text-tertiary">All outlets</span>
                      ) : (
                        <Select
                          aria-label={`${user.username}'s outlet`}
                          value={user.outlet_id?.toString() ?? ''}
                          options={outletOptions}
                          disabled={updateUser.isPending}
                          onChange={(e) =>
                            save(user, { outlet_id: e.target.value ? parseInt(e.target.value, 10) : null }, 'User outlet updated')
                          }
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
