// Scrape MotoAmerica's published per-event PDF set.
//
// MA publishes every race-weekend result as a PDF at:
//   https://motoamericaregistration.com/Results/{year}/{trackCode}/{YY}_{round}_{trackCode}_{class}_{session}_{category}.pdf
// e.g. 26_4_RDATL_SBK_R2_res.pdf → 2026, round 4 (Atlanta), Superbike, Race 2, Classification.
//
// The filesystem directories aren't indexed, but motoamericaregistration.com
// serves a WordPress results page whose form POSTs back the PDF list for a
// (year, round, class, session) combination. We drive that form.

import { load } from 'cheerio';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { USER_AGENT } from './lib/fetch.ts';

const BASE_URL = 'https://www.motoamericaregistration.com/results';
// MA's WordPress results page ignores the year path segment and always serves
// the current (2026) season's dropdown + PDFs — POSTing form_round=4 to
// /results/2025/ returns Atlanta 2026 PDFs. Historical archaeology (2025-) is
// a deferred effort: it'll need direct URL enumeration against
// /Results/{year}/{trackCode}/ with HEAD requests to probe which filenames
// exist, since the form interface can't surface prior years.
const YEARS = [2026] as const;
const ROUND_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);
const REQUEST_DELAY_MS = 200;
// Server occasionally stalls on invalid round numbers or returns a slow page —
// cap every request so we don't freeze the whole run on a single stuck socket.
const REQUEST_TIMEOUT_MS = 15_000;

type ClassSpec = { form: string; slug: string; codes: readonly string[] };

// Class codes are pulled from the filename, not the form value. `codes` lists
// every class code we've seen MA use for that class — some classes publish
// sibling cup PDFs under an additional code (e.g. SBK rounds emit SBC/SBCPTS
// for Superbike Cup — those stay attached to 'superbike' as sibling rows).
// Class slugs match the app's data vocabulary (standings.json / class-guides.ts):
// 'mission-king-of-the-baggers' and 'build-train-race' rather than ad-hoc
// shortenings. Mismatched slugs silently hide PDFs from the standings pages.
const CLASSES: ClassSpec[] = [
  { form: 'Superbike', slug: 'superbike', codes: ['SBK'] },
  { form: 'Supersport', slug: 'supersport', codes: ['SSP'] },
  { form: 'Twins Cup', slug: 'twins-cup', codes: ['TWN', 'TWC'] },
  { form: 'Talent Cup', slug: 'talent-cup', codes: ['TLC', 'TAL'] },
  { form: 'Mission King of the Baggers', slug: 'mission-king-of-the-baggers', codes: ['KOB', 'MKB', 'BAG'] },
  { form: 'Royal Enfield Build.Train.Race', slug: 'build-train-race', codes: ['BTR', 'REB'] },
];

type SessionSpec = { form: string; label: string };

// Form select values carry trailing spaces verbatim — preserved here. The label
// is the trimmed, user-facing version.
const SESSIONS: SessionSpec[] = [
  { form: 'Free Practice 1 ', label: 'Free Practice 1' },
  { form: 'Timed Practice', label: 'Timed Practice' },
  { form: 'Free Practice 2', label: 'Free Practice 2' },
  { form: 'Qualifying ', label: 'Qualifying' },
  { form: 'Warm Up ', label: 'Warm Up' },
  { form: 'Race 1 ', label: 'Race 1' },
  { form: 'Race 2 ', label: 'Race 2' },
  { form: 'Standings', label: 'Standings' },
];

// Track-code → app event slug. MA's codes start with "RD" and are stable across
// years. Extend this map as we see new tracks. Unmapped codes are still
// written to the JSON (with track_code as the event_slug fallback) so Phase 1
// never silently drops data.
const TRACK_CODE_TO_EVENT_SLUG: Record<string, string> = {
  RDATL: 'atlanta',
  RDBAR: 'barber',
  RDRA: 'america',
  RDROA: 'america',
  RDRMP: 'ridge',
  RDRIDGE: 'ridge',
  RDLAG: 'laguna',
  RDMO: 'ohio',
  RDMID: 'ohio',
  RDVIR: 'vir',
  RDCOT: 'cota',
  RDCOTA: 'cota',
  RDNJ: 'newJersey',
  RDNJMP: 'newJersey',
  RDDAY: 'daytona200',
  RDDB: 'daytona200',
  RDDAYTONA: 'daytona200',
  // Actual track codes observed on motoamericaregistration.com — these don't
  // follow the 'RD…' prefix convention.
  DAY: 'daytona200',
  // Pre-season tests and invitational rounds don't have schedule entries and
  // aren't reachable through the schedule nav. They stay addressable by the
  // lowercase track-code slug via the results landing page.
  PST: 'test-cota',
  COTAGP: 'talent-cup-motogp',
};

// Filename category → human label shown in dll-pdf-downloads.
const CATEGORY_LABELS: Record<string, string> = {
  res: 'Classification',
  lap: 'Lap Times',
  lapchart: 'Lap Chart',
  grid: 'Starting Grid',
  points: 'Championship Points',
  sbcpts: 'Superbike Cup Points',
  seg: 'Segment Times',
  fseg: 'Best Segment Times',
  allrep: 'Analysis',
  entry: 'Entry List',
};

// Sort order within a session's PDF list — favors the most-wanted items first.
const CATEGORY_ORDER: Record<string, number> = {
  res: 0,
  grid: 1,
  lap: 2,
  lapchart: 3,
  seg: 4,
  fseg: 5,
  allrep: 6,
  entry: 7,
  points: 8,
  sbcpts: 9,
};

type EventPdf = {
  url: string;
  label: string;
  category: string;
  class_slug: string | null;
  class_code: string | null;
  session_code: string | null;
  session_label: string | null;
};

type EventPdfGroup = {
  event_slug: string;
  season_year: number;
  round_number: number;
  track_code: string;
  title: string;
  pdfs: EventPdf[];
};

type RoundMeta = { number: number; title: string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function postForm(year: number, round: number, formClass: string, formSession: string): Promise<string> {
  const body = new URLSearchParams({
    form_round: String(round),
    form_class: formClass,
    form_session: formSession,
  });
  return fetchWithTimeout(`${BASE_URL}/${year}/`, {
    method: 'POST',
    headers: {
      'user-agent': USER_AGENT,
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'text/html',
    },
    body: body.toString(),
    redirect: 'follow',
  });
}

async function fetchYearPage(year: number): Promise<string> {
  return fetchWithTimeout(`${BASE_URL}/${year}/`, {
    headers: { 'user-agent': USER_AGENT, accept: 'text/html' },
    redirect: 'follow',
  });
}

// Read the round <select> from the year page to learn {roundNumber → title}.
// Titles look like "1.2026 MotoAmerica Superbikes at Atlanta" — we strip the
// "N." championship-order prefix when present.
function parseRoundsFromYearPage(html: string): RoundMeta[] {
  const $ = load(html);
  const rounds: RoundMeta[] = [];
  $('select[name="form_round"] option').each((_, el) => {
    const value = $(el).attr('value');
    const title = ($(el).attr('title') ?? $(el).text() ?? '').trim();
    if (!value || !title) return;
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    const cleaned = title.replace(/^\d+\.\s*/, '').trim();
    rounds.push({ number: num, title: cleaned });
  });
  return rounds;
}

function extractPdfHrefs(html: string): string[] {
  const $ = load(html);
  const urls = new Set<string>();
  $('a[href*="/Results/"]').each((_, a) => {
    const href = $(a).attr('href');
    if (!href) return;
    if (!/\.pdf(\?|$)/i.test(href)) return;
    urls.add(href.replace(/^http:/, 'https:'));
  });
  return Array.from(urls);
}

type ParsedFilename = {
  year_short: string;
  round_number: number;
  track_code: string;
  class_code: string;
  session_code: string;
  category: string;
};

function parseFilename(url: string): ParsedFilename | null {
  const filename = decodeURIComponent(url.split('/').pop() ?? '').replace(/\.pdf$/i, '');
  const parts = filename.split('_');
  if (parts.length < 6) return null;
  const [year_short, round, trackCode, classCode, sessionCode, ...rest] = parts;
  const round_number = Number(round);
  if (!Number.isFinite(round_number)) return null;
  return {
    year_short,
    round_number,
    track_code: trackCode,
    class_code: classCode,
    session_code: sessionCode,
    category: rest.join('_'),
  };
}

function classSlugForCode(code: string): string | null {
  for (const c of CLASSES) if (c.codes.includes(code)) return c.slug;
  return null;
}

function eventSlugForTrack(trackCode: string): string {
  return TRACK_CODE_TO_EVENT_SLUG[trackCode] ?? trackCode.toLowerCase();
}

function humanLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Session code → user-facing label. URL uses 'P1'/'R2'/'PTS' style; we keep
// the session_label returned by the form when we captured it, but also fall
// back to a static map for sessions we've seen.
const SESSION_CODE_LABELS: Record<string, string> = {
  P1: 'Free Practice 1',
  P2: 'Free Practice 2',
  TP: 'Timed Practice',
  Q1: 'Qualifying',
  QP: 'Qualifying',
  WUP: 'Warm Up',
  R1: 'Race 1',
  R2: 'Race 2',
  PTS: 'Championship Standings',
};

async function main(): Promise<void> {
  const eventsByKey = new Map<string, EventPdfGroup>();
  // Track which (url) we've already written to avoid dupes when multiple
  // form submissions return overlapping link blocks.
  const seenUrls = new Set<string>();
  let requestCount = 0;
  let pdfCount = 0;

  for (const year of YEARS) {
    console.log(`\n━━━ ${year} ━━━`);
    const yearPage = await fetchYearPage(year);
    requestCount += 1;
    const rounds = parseRoundsFromYearPage(yearPage);
    console.log(`  ${rounds.length} rounds advertised in year page`);
    const roundTitles = new Map<number, string>();
    for (const r of rounds) roundTitles.set(r.number, r.title);

    for (const round of ROUND_NUMBERS) {
      const startRoundPdfs = pdfCount;
      const startRoundRequests = requestCount;
      const roundTitle = roundTitles.get(round) ?? '(no title)';
      for (const cls of CLASSES) {
        for (const session of SESSIONS) {
          await sleep(REQUEST_DELAY_MS);
          requestCount += 1;
          let html: string;
          try {
            html = await postForm(year, round, cls.form, session.form);
          } catch (err) {
            console.warn(
              `  ! ${year} R${round} ${cls.slug} ${session.label}: ${(err as Error).message}`,
            );
            continue;
          }

          for (const url of extractPdfHrefs(html)) {
            if (seenUrls.has(url)) continue;
            seenUrls.add(url);
            const parsed = parseFilename(url);
            if (!parsed) continue;
            // Sanity: the filename-encoded year-short should match the year.
            const expectedYearShort = String(year % 100).padStart(2, '0');
            if (parsed.year_short !== expectedYearShort) continue;

            const eventSlug = eventSlugForTrack(parsed.track_code);
            const groupKey = `${year}-${parsed.round_number}-${parsed.track_code}`;
            let group = eventsByKey.get(groupKey);
            if (!group) {
              group = {
                event_slug: eventSlug,
                season_year: year,
                round_number: parsed.round_number,
                track_code: parsed.track_code,
                title: roundTitles.get(parsed.round_number) ?? parsed.track_code,
                pdfs: [],
              };
              eventsByKey.set(groupKey, group);
            }

            const classSlugFromFile = classSlugForCode(parsed.class_code);
            const isChampionshipWide = parsed.session_code === 'PTS';
            const pdf: EventPdf = {
              url,
              label: humanLabel(parsed.category),
              category: parsed.category,
              class_slug: classSlugFromFile,
              class_code: parsed.class_code,
              session_code: isChampionshipWide ? null : parsed.session_code,
              session_label: isChampionshipWide
                ? null
                : SESSION_CODE_LABELS[parsed.session_code] ?? parsed.session_code,
            };
            group.pdfs.push(pdf);
            pdfCount += 1;
          }
        }
      }
      const pdfsFound = pdfCount - startRoundPdfs;
      const requestsSpent = requestCount - startRoundRequests;
      console.log(
        `  R${String(round).padStart(2)}  ${String(pdfsFound).padStart(3)} PDFs  (${requestsSpent} requests)  — ${roundTitle}`,
      );
    }
  }

  // Sort events chronologically within a year; within an event sort PDFs by
  // (class, session, category) for stable, readable JSON.
  const events = Array.from(eventsByKey.values()).sort((a, b) => {
    if (a.season_year !== b.season_year) return a.season_year - b.season_year;
    return a.round_number - b.round_number;
  });
  for (const group of events) {
    group.pdfs.sort((a, b) => {
      if (a.class_slug !== b.class_slug) {
        return (a.class_slug ?? '').localeCompare(b.class_slug ?? '');
      }
      const sa = a.session_code ?? 'zzz';
      const sb = b.session_code ?? 'zzz';
      if (sa !== sb) return sa.localeCompare(sb);
      const oa = CATEGORY_ORDER[a.category] ?? 99;
      const ob = CATEGORY_ORDER[b.category] ?? 99;
      if (oa !== ob) return oa - ob;
      return a.category.localeCompare(b.category);
    });
  }

  const result = {
    series: 'motoamerica',
    source_url: `${BASE_URL}/{year}/`,
    scraped_at: new Date().toISOString(),
    events,
  };

  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = join(here, 'output');
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, 'event-pdfs.json');
  await writeFile(outPath, JSON.stringify(result, null, 2) + '\n', 'utf8');

  console.log(`\n✓ Crawl complete`);
  console.log(`  requests:   ${requestCount}`);
  console.log(`  events:     ${events.length}`);
  console.log(`  PDFs total: ${pdfCount}`);
  for (const e of events) {
    console.log(
      `  ${e.season_year} R${String(e.round_number).padStart(2)}  ${e.track_code.padEnd(7)}  ${e.event_slug.padEnd(12)}  ${String(e.pdfs.length).padStart(3)} PDFs  — ${e.title}`,
    );
  }
  console.log(`  wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
