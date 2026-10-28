'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';
import { Card, CardContent, Badge, EntityCode } from '@/components/ui';
import type { Supplier } from '@/types';
import { formatDisplayName, supplierDisplayName } from '@/lib/format/displayName';

interface SupplierListRowProps {
  supplier: Supplier;
  href?: string;
}

export function SupplierListRow({ supplier, href }: SupplierListRowProps) {
  const { code, name } = supplierDisplayName(supplier);
  return (
    <Link href={href ?? `/suppliers/${supplier.id}`} className="block">
      <Card interactive className="py-4">
        <CardContent className="mt-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {code && <EntityCode>{code}</EntityCode>}
              <div className="flex items-start gap-2">
                <h3 className="min-w-0 text-base font-medium text-ink break-words hover:text-primary">
                  {name}
                </h3>
                {!supplier.is_active && (
                  <Badge variant="secondary" className="shrink-0">Archived</Badge>
                )}
              </div>
              <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                {supplier.shipping_company_name && (
                  <span className="text-xs text-muted-foreground">Ships via {formatDisplayName(supplier.shipping_company_name)}</span>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{supplier.address}</span>
                  </div>
                )}
                {supplier.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{supplier.phone_number}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
