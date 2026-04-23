# Double Long Lap

A fan-built MotoAmerica hub: standings, schedule, results, rider profiles, venue
guides. Static-deployed to GitHub Pages at
[doublelonglap.com](https://doublelonglap.com).

Built with Angular 21 + PrimeNG. Theme is a custom PrimeNG preset derived from
Canonical's Vanilla Framework design tokens. Output is fully prerendered (one
HTML file per route) so Googlebot sees the same content as a browser.

## Repo layout

```
src/app/
├── data/        ← framework-neutral data layer (slug, country, travel-guides,
│                  class-guides, class-notes, data-types, data, generated)
├── pages/       ← route components (home, standings, schedule, results,
│                  riders, venues + their detail pages, coming-soon)
├── components/  ← shared components (newsletter-signup, sponsorship,
│                  class-guide, class-notes, class-grid-table, affiliate-block)
├── seo/         ← SeoService + JSON-LD injection
├── theme/       ← VanillaPreset + dark-mode service
└── app.{ts,html,scss,config.ts,routes.ts,routes.server.ts}
scripts/
├── embed-data.ts   ← codegen: scrapers/output/*.json → src/app/data/generated.ts
├── build-og.ts     ← generates public/og-default.png (1200×630)
├── build-sitemap.ts← generates dist/dll/browser/sitemap.xml + robots.txt
└── diff-routes.ts  ← (manual) URL parity audit, kept for future migrations
scrapers/        ← MotoAmerica.com scrapers (cheerio). Run manually.
docs/            ← migration plan and research (not committed by the assistant)
```

## Working on it

Requires Node 22+.

```bash
npm install
npm run build           # prebuild → ng build → postbuild (sitemap + robots)
npm start               # dev server at http://localhost:4200
npm run embed-data      # regenerate src/app/data/generated.ts only
npm run diff-routes     # parity audit (needs both deployments present)
```

Static output lands in `dist/dll/browser/`. Prerendered routes are discovered
from `src/app/app.routes.ts` and parameterized via `getPrerenderParams` in
`src/app/app.routes.server.ts`. Per-route SEO is set via `SeoService`.

## Refreshing the scraped data

The site reads from JSON snapshots in `scrapers/output/`. Refresh them manually
when MotoAmerica updates standings/schedule:

```bash
npm run refresh         # all scrapers + stats packet
# or individual:
npm run scrape:standings
npm run scrape:schedule
npm run scrape:classes
npm run scrape:riders
npm run packet:stats
```

After refreshing, `npm run build` re-embeds the new data into the bundle.

## Deploy

Push to `main`. `.github/workflows/deploy.yml` runs `npm ci && npm run build`
and uploads `dist/dll/browser/` as the GitHub Pages artifact.

The pre-cutover state (last shipping Next.js commit) is preserved at the
`pre-angular` git tag.
