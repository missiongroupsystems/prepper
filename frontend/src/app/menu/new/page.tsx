'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppState } from '@/lib/store';
import { MenuBuilder } from '@/components/menu/MenuBuilder';

export default function NewMenuPage() {
  const router = useRouter();
  const { userType, isManager } = useAppState();

  useEffect(() => {
    if (userType !== 'admin' && !isManager) {
      router.push('/menu');
    }
  }, [userType, isManager, router]);

  return <MenuBuilder />;
}
