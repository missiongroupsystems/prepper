/* eslint-disable @next/next/no-img-element -- static SVG lockups shown at their own size */
import { BrandLogo } from '@/components/brand';
import { Section, Subsection } from './primitives';

const LOCKUPS = ['inlinelong', 'inlineshort', 'sidestack', 'stackleft', 'stackcentre', 'icon', 'favicon'] as const;

export function BrandSection() {
  return (
    <Section title="Branding">
      <Subsection title="BrandLogo — inherits currentColor; paint with text-accent">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-5 light rounded-lg border border-border bg-card p-6">
            <BrandLogo variant="full" className="h-8 w-auto self-start text-accent" />
            <BrandLogo variant="short" className="h-8 w-auto self-start text-accent" />
            <BrandLogo variant="mark" className="size-10 text-accent" />
          </div>
          <div className="flex flex-col gap-5 dark rounded-lg border border-border bg-card p-6">
            <BrandLogo variant="full" className="h-8 w-auto self-start text-accent" />
            <BrandLogo variant="short" className="h-8 w-auto self-start text-accent" />
            <BrandLogo variant="mark" className="size-10 text-accent" />
          </div>
        </div>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          {'<BrandLogo variant="full" | "short" | "mark" className="h-6 w-auto text-accent" />'}
        </p>
      </Subsection>

      <Subsection title="Lockup files — public/logo/MS-Recipes-blk-*.svg">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {LOCKUPS.map((name) => (
            <figure key={name} className="flex flex-col gap-2 rounded-lg border border-border light bg-card p-4">
              <div className="flex h-20 items-center justify-center">
                <img src={`/logo/MS-Recipes-blk-${name}.svg`} alt={`Mission Recipes ${name} lockup`} className="max-h-20 max-w-full" />
              </div>
              <figcaption className="font-mono text-xs text-muted-foreground">{name}</figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          The files carry a fixed forest fill, so they always sit on a light tile. In the UI, use
          BrandLogo. Favicon, apple-icon and PWA icons are rendered from the favicon and icon cuts;
          the tasting email uses MS-Recipes-blk-inlinelong.png.
        </p>
      </Subsection>
    </Section>
  );
}
