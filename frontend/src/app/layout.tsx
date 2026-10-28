import type { Metadata } from 'next';
import { Providers } from '@/lib/providers';
import { AppShell } from '@/components/app';
import { SIDEBAR_BOOT_SCRIPT } from '@/components/app/sidebar-mode';
import { envMetadataTitle, readAppEnv, readBuild } from '@/components/env-badge/env';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';
import './globals.css';

// Satoshi is self-hosted via @font-face in globals.css and reached through the
// `--brand-typeface-*` seam; mono is the system stack. No external font host.
// Icons come from the file conventions: app/icon.svg, app/apple-icon.png, app/manifest.ts.
export const metadata: Metadata = {
  title: envMetadataTitle('Mission Recipes', readAppEnv()),
  description: 'Kitchen-first recipe workspace for chefs and operators — part of the Mission Systems suite',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No-flash boot: stamps `.dark` + color-scheme (lib/theme.ts) and the rail mode
            (`data-sidebar`, components/app/sidebar-mode.ts) before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT + SIDEBAR_BOOT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <Providers>
          <AppShell appEnv={readAppEnv()} build={readBuild()}>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
