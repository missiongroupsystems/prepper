'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';
import { Toaster } from '@/components/ui/Toaster';
import { AppProvider } from './store';
import { AuthGuard } from '@/components/AuthGuard';
import { setQueryClientRef } from './query-client-ref';
import { migrateLegacyStorageKeys } from './storage-keys';
import { ThemeProvider } from '@/components/theme';

// Runs once when the client bundle loads — before any component renders or
// effect reads auth / last-route from localStorage. No-op on the server.
migrateLegacyStorageKeys();

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          refetchOnWindowFocus: false,
        },
      },
    });
    setQueryClientRef(client);
    return client;
  });

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <AuthGuard>{children}</AuthGuard>
          <Toaster />
        </AppProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
