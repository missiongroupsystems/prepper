import type { Metadata } from 'next';
import { Providers } from '@/lib/providers';
import { TopNav } from '@/components/layout';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';
import './globals.css';

// Satoshi is self-hosted via @font-face in globals.css and reached through the
// `--brand-typeface-*` seam; mono is the system stack. No external font host.
// Icons come from the file conventions: app/icon.svg, app/apple-icon.png, app/manifest.ts.
export const metadata: Metadata = {
  title: 'Mission Recipes',
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
        {/* No-flash theme: stamps `.dark` + color-scheme before first paint (lib/theme.ts). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <Providers>
          <div className="flex h-dvh flex-col">
            <TopNav />
            <main className="flex-1 min-h-0 overflow-hidden">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
