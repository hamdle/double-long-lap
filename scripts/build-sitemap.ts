// Postbuild step that walks the embedded data and emits sitemap.xml +
// robots.txt into the Angular dist output. Replaces Next.js's MetadataRoute
// sitemap.ts / robots.ts. Same priorities and changeFrequencies as the
// legacy site so the SEO surface stays identical.
//
// Run via `npm run postbuild` (auto after `ng build`) or `npm run build-sitemap`.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = join(ROOT, 'dist', 'dll', 'browser');

const BASE = 'https://doublelonglap.com';

type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
type SitemapEntry = {
  url: string;
  changeFrequency: ChangeFreq;
  priority: number;
};

// Read JSON sources directly from legacy-next/scripts/output, same as
// embed-data.ts — keeps both codegens in lockstep with the scrapers.
const DATA_DIR = join(ROOT, 'scrapers', 'output');
function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, name), 'utf8')) as T;
}

type StandingsFile = {
  classes: Array<{ class_slug: string; top_riders: Array<{ name: string }> }>;
};
type ScheduleFile = { events: Array<{ event_slug: string }> };

const standings = readJson<StandingsFile>('standings.json');
const schedule = readJson<ScheduleFile>('schedule.json');

// Mirror getKnownClassSlugs() — union of scraped + authored guide slugs.
// Hard-coded list of guide-only classes here keeps the script self-contained;
// it must stay in sync with src/app/data/class-guides.ts (only BTR is
// guide-only today).
const GUIDE_ONLY_SLUGS = ['build-train-race'];
const knownClassSlugs = Array.from(
  new Set([...standings.classes.map((c) => c.class_slug), ...GUIDE_ONLY_SLUGS]),
);

// Mirror getAllRiders() — uses standings (top-of-class) for SSG params, not
// the full roster. The legacy sitemap uses getAllRiders too, so same set.
const TRAVEL_GUIDE_SLUGS = [
  'daytona200', 'atlanta', 'barber', 'america', 'ridge',
  'laguna', 'ohio', 'vir', 'cota', 'newJersey',
];

function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Source of truth must match the prerender params in app.routes.server.ts —
// only riders surfaced by getAllRiders() (top-of-class union) get a static
// page, so they're the only riders that should be in the sitemap.
const riderSlugs = Array.from(
  new Set(
    standings.classes.flatMap((c) => c.top_riders.map((r) => slugify(r.name))),
  ),
);

const entries: SitemapEntry[] = [
  { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
  { url: `${BASE}/standings`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/schedule`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/riders`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${BASE}/venues`, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/results`, changeFrequency: 'weekly', priority: 0.5 },
  ...knownClassSlugs.map((s) => ({
    url: `${BASE}/standings/${s}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })),
  ...schedule.events.map((e) => ({
    url: `${BASE}/schedule/${e.event_slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })),
  ...schedule.events.map((e) => ({
    url: `${BASE}/venues/${e.event_slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  })),
  ...TRAVEL_GUIDE_SLUGS.map((s) => ({
    url: `${BASE}/venues/${s}/travel`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  })),
  ...riderSlugs.map((s) => ({
    url: `${BASE}/riders/${s}`,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  })),
];

const lastModified = new Date().toISOString();

const sitemapXml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entries
    .map(
      (e) =>
        `  <url>\n` +
        `    <loc>${e.url}</loc>\n` +
        `    <lastmod>${lastModified}</lastmod>\n` +
        `    <changefreq>${e.changeFrequency}</changefreq>\n` +
        `    <priority>${e.priority}</priority>\n` +
        `  </url>`,
    )
    .join('\n') +
  '\n</urlset>\n';

const robotsTxt =
  `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\nHost: ${BASE}\n`;

writeFileSync(join(OUT_DIR, 'sitemap.xml'), sitemapXml);
writeFileSync(join(OUT_DIR, 'robots.txt'), robotsTxt);

// eslint-disable-next-line no-console
console.log(
  `build-sitemap: wrote sitemap.xml (${entries.length} urls) and robots.txt to ${OUT_DIR}`,
);
