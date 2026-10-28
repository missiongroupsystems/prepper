import type { MetadataRoute } from 'next';

/**
 * Web app manifest — makes Mission Recipes installable. A manifest needs concrete colours, so
 * these literals mirror the light tokens `--background` and `--accent` (styles/tokens.css).
 *
 * PNGs for Android's install prompt (it will not take an SVG alone), plus a maskable one —
 * full-bleed accent with the mark inside the 80% safe zone, so a launcher's crop never clips
 * it. All rendered from public/logo/MS-Recipes-blk-{favicon,icon}.svg.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mission Recipes',
    short_name: 'Recipes',
    description: 'Kitchen-first recipe workspace for chefs and operators',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf9f6',
    theme_color: '#1d3a2a',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/logo/MS-Recipes-blk-favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
