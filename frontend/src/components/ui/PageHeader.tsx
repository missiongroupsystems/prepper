'use client';

import { SectionHeader } from '@/components/app/SectionHeader';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Legacy page head, kept so existing callers inherit the SectionHeader look until Phase 3 moves
 * them onto `Page` + `SectionHeader`. `children` are the actions; the bottom margin stands in
 * for the gap `Page` will provide.
 */
export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return <SectionHeader title={title} description={description} actions={children} className={cn('mb-6', className)} />;
}
