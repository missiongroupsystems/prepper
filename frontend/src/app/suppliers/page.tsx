'use client';

/** /suppliers — the supplier list on its own; it is also the Suppliers tab of /ingredients. */
import { Page } from '@/components/app';
import { SuppliersTab } from '@/components/suppliers';

export default function SuppliersPage() {
  return (
    <Page>
      <SuppliersTab />
    </Page>
  );
}
