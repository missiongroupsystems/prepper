'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileQuestion } from 'lucide-react';
import { Page, SectionHeader } from '@/components/app';
import { useAppState } from '@/lib/store';
import { useMenu } from '@/lib/hooks';
import { MenuBuilder } from '@/components/menu/MenuBuilder';
import { EmptyState, Skeleton, buttonClasses } from '@/components/ui';

interface EditMenuPageProps {
  params: Promise<{ id: string }>;
}

export default function EditMenuPage({ params }: EditMenuPageProps) {
  const { id } = use(params);
  const menuId = parseInt(id, 10);
  const router = useRouter();
  const { userType, isManager } = useAppState();
  const { data: menu, isLoading, error } = useMenu(menuId);

  useEffect(() => {
    if (userType !== 'admin' && !isManager) {
      router.push('/menu');
    }
  }, [userType, isManager, router]);

  if (isLoading) {
    return (
      <Page>
        <SectionHeader eyebrow="Kitchen · Menus" title="Edit menu" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </Page>
    );
  }

  if (error || !menu) {
    return (
      <Page>
        <SectionHeader eyebrow="Kitchen · Menus" title="Edit menu" />
        <EmptyState
          icon={FileQuestion}
          title="Menu not found"
          description="It may have been archived, or you may not have access to it."
          action={
            <Link href="/menu" className={buttonClasses('secondary')}>
              Back to menus
            </Link>
          }
        />
      </Page>
    );
  }

  // Keyed by id so a fork (a new menu id) starts a fresh draft.
  return <MenuBuilder key={menu.id} menu={menu} />;
}
