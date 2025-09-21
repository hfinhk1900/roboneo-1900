'use client';

import { getUsersAction } from '@/actions/get-users';
import { UserManagement } from '@/components/admin/user-management';
import { UsersTable } from '@/components/admin/users-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUsersStore } from '@/stores/users-store';
import type { AdminUser } from '@/types/admin-user';
import type { SortingState } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function UsersPageClient() {
  const t = useTranslations('Dashboard.admin.users');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [data, setData] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const refreshTrigger = useUsersStore((state) => state.refreshTrigger);
  const triggerRefresh = useUsersStore((state) => state.triggerRefresh);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const result = await getUsersAction({
          pageIndex,
          pageSize,
          search,
          sorting,
        });

        if (result?.data?.success) {
          setData((result.data.data?.items as AdminUser[]) || []);
          setTotal(result.data.data?.total || 0);
        } else {
          const errorMessage = result?.data?.error || t('error');
          toast.error(errorMessage);
          setData([]);
          setTotal(0);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error(t('error'));
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [pageIndex, pageSize, search, sorting, refreshTrigger]);

  return (
    <div className="container mx-auto px-4 py-6">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">User List</TabsTrigger>
          <TabsTrigger value="delete">Delete User</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <UsersTable
            data={data}
            total={total}
            pageIndex={pageIndex}
            pageSize={pageSize}
            search={search}
            loading={loading}
            onSearch={setSearch}
            onPageChange={setPageIndex}
            onPageSizeChange={setPageSize}
            onSortingChange={setSorting}
          />
        </TabsContent>

        <TabsContent value="delete" className="mt-6">
          <UserManagement onUserDeleted={triggerRefresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
