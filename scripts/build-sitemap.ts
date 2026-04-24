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
  classes: Array<{ class_slug: string; top_riders: Array<{ name: string }>; season_year: number | null }>;
};
type ScheduleFile = { events: Array<{ event_slug: string }> };
type EventPdfsFile = {
  events: Array<{ event_slug: string; season_year: number }>;
};
type SessionResultsFile = {
  sessions: Array<{
    season_year: number;
    event_slug: string;
    class_slug: string;
    session_code: string;
  }>;
};

const standings = readJson<StandingsFile>('standings.json');
const schedule = readJson<ScheduleFile>('schedule.json');
const eventPdfs = readJson<EventPdfsFile>('event-pdfs.json');
const sessionResults = readJson<SessionResultsFile>('session-results.json');

// Mirror pages/results-session.ts's sessionUrlSegment(): URL is lowercase.
function sessionUrlSegment(sessionCode: string): string {
  const map: Record<string, string> = {
    P1: 'p1', P2: 'p2', TP: 'tp', Q1: 'q1', WU: 'wu', R1: 'r1', R2: 'r2',
  };
  return map[sessionCode] ?? sessionCode.toLowerCase();
}

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

// Years we emit year-scoped standings and results URLs for. Sourced from the
// PDF manifest so it stays in sync with whatever the crawler actually picked
// up.
const contentYears = Array.from(
  new Set(eventPdfs.events.map((e) => e.season_year)),
).sort((a, b) => b - a);

const entries: SitemapEntry[] = [
  { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
  { url: `${BASE}/standings`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/schedule`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/riders`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${BASE}/venues`, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/results`, changeFrequency: 'weekly', priority: 0.6 },
  ...contentYears.flatMap((year) =>
    knownClassSlugs.map((s) => ({
      url: `${BASE}/standings/${year}/${s}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ),
  ...eventPdfs.events.map((e) => ({
    url: `${BASE}/results/${e.season_year}/${e.event_slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  })),
  ...sessionResults.sessions.map((s) => ({
    url: `${BASE}/results/${s.season_year}/${s.event_slug}/${s.class_slug}/${sessionUrlSegment(s.session_code)}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
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
