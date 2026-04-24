// Parse MotoAmerica session-result PDFs ("_res.pdf") into structured rows.
//
// Strategy: run each PDF through `pdftotext -tsv`, which emits one record per
// word with a bounding box. Group words into lines by y-coordinate, find the
// header row ("Pos / No. / Name / Make / Diff / Total Tm / Best Tm / Sponsor"
// for races; swap in "Best Tm / In Lap / Diff" for qualifying and practice),
// and then assign each word in a data row to the nearest header column by
// x-coordinate center. This is more robust than char-position slicing against
// `pdftotext -layout`: right-aligned numeric columns (Pos, Diff, times) bleed
// into neighbouring character columns under `-layout`, but each word's
// bounding box is always exact.
//
// A "Not classified" header row splits finishers from DNFs; DNF rows carry
// `DNF` / `DQ` / `DNS` in the Pos and Diff columns. We preserve that status
// on the output rows and set `position` to null for non-classified riders.

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { USER_AGENT } from './lib/fetch.ts';

type ManifestEventPdf = {
  url: string;
  label: string;
  category: string;
  class_slug: string | null;
  class_code: string | null;
  session_code: string | null;
  session_label: string | null;
};

type ManifestEvent = {
  event_slug: string;
  season_year: number;
  round_number: number;
  track_code: string;
  title: string;
  pdfs: ManifestEventPdf[];
};

type Manifest = {
  series: string;
  events: ManifestEvent[];
};

// ─── Output shape (mirrors data-types.SessionResult) ─────────────────────────

type RowStatus = 'classified' | 'dnf' | 'dns' | 'dsq' | 'lapped';

type SessionResultRow = {
  position: number | null;
  status: RowStatus;
  rider_name: string;
  rider_number: number | null;
  team: string | null;
  bike_make: string | null;         // 3-letter code — YAM, BMW, DUC, SUZ, HON, KTM, ...
  best_lap_ms: number | null;
  total_time_ms: number | null;
  gap_to_leader_ms: number | null;
  laps_down: number | null;         // e.g. 1 for "1 Lap" gap
  best_lap_in_lap: number | null;   // qualifying/practice: lap number of the best lap
};

type SessionResult = {
  series: string;
  season_year: number;
  round_number: number;
  event_slug: string;
  track_code: string;
  class_slug: string;
  class_code: string;
  session_code: string;
  session_label: string;
  source_url: string;
  scraped_at: string;
  rows: SessionResultRow[];
};

type SessionResultsFile = {
  series: string;
  scraped_at: string;
  sessions: SessionResult[];
};

// ─── PDF text extraction (TSV with bounding boxes) ───────────────────────────

async function fetchPdf(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, accept: 'application/pdf' },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} fetching ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function pdftotextTsv(pdf: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('pdftotext', ['-tsv', '-', '-'], { stdio: ['pipe', 'pipe', 'pipe'] });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on('data', (b) => out.push(b));
    child.stderr.on('data', (b) => err.push(b));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`pdftotext exited ${code}: ${Buffer.concat(err).toString()}`));
        return;
      }
      resolve(Buffer.concat(out).toString('utf8'));
    });
    child.stdin.write(pdf);
    child.stdin.end();
  });
}

// ─── TSV parsing → word records ─────────────────────────────────────────────

type Word = {
  page: number;
  top: number;
  left: number;
  right: number;  // left + width
  text: string;
};

// Level 5 rows in the TSV are words. Page sentinel lines (###PAGE###, ###FLOW###,
// ###LINE###) are emitted as "text" values too, but at level < 5 — we skip
// anything that isn't a real word.
function parseTsvWords(tsv: string): Word[] {
  const lines = tsv.split(/\r?\n/);
  if (lines.length === 0) return [];
  const header = lines[0].split('\t');
  const idx = (name: string): number => header.indexOf(name);
  const iLevel = idx('level');
  const iPage = idx('page_num');
  const iTop = idx('top');
  const iLeft = idx('left');
  const iWidth = idx('width');
  const iText = idx('text');

  const words: Word[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < header.length) continue;
    if (cols[iLevel] !== '5') continue;
    const text = cols[iText];
    if (!text || text.startsWith('###')) continue;
    const page = Number(cols[iPage]);
    const top = Number(cols[iTop]);
    const left = Number(cols[iLeft]);
    const width = Number(cols[iWidth]);
    if (!Number.isFinite(top) || !Number.isFinite(left)) continue;
    words.push({ page, top, left, right: left + width, text });
  }
  return words;
}

// Group words into lines by (page, top) with a small tolerance. Within each
// group, words are already sorted by `left_num` in the TSV emission — but we
// re-sort here just to be safe.
type Line = {
  page: number;
  top: number;
  words: Word[];
  text: string;  // words joined with single spaces (for header-matching)
};

function groupLines(words: Word[]): Line[] {
  const TOP_TOL = 2; // points
  const sorted = [...words].sort((a, b) => a.page - b.page || a.top - b.top || a.left - b.left);
  const lines: Line[] = [];
  for (const w of sorted) {
    const last = lines[lines.length - 1];
    if (last && last.page === w.page && Math.abs(last.top - w.top) <= TOP_TOL) {
      last.words.push(w);
    } else {
      lines.push({ page: w.page, top: w.top, words: [w], text: '' });
    }
  }
  for (const line of lines) {
    line.words.sort((a, b) => a.left - b.left);
    line.text = line.words.map((w) => w.text).join(' ');
  }
  return lines;
}

// ─── Column layout ──────────────────────────────────────────────────────────

type ColumnKey =
  | 'pos'
  | 'no'
  | 'name'
  | 'make'
  | 'diff'
  | 'total'
  | 'best'
  | 'inlap'
  | 'sponsor';

type Column = {
  key: ColumnKey;
  centre: number;  // x-coord of the header token's centre
};

// Each header cell may be one or two words ("Pos", "No.", "Name", "Make",
// "Diff", "Total Tm", "Best Tm", "In Lap", "Sponsor"). We match by the first
// word token, then consume an optional follow-up ("Tm", "Lap") to compute the
// cell's centre across both words.
const SINGLE_WORD_HEADERS: Record<string, ColumnKey> = {
  Pos: 'pos',
  Name: 'name',
  Make: 'make',
  Diff: 'diff',
  Sponsor: 'sponsor',
};
// "No." prints with an attached period; TSV treats it as a single word.
const NO_DOT_KEY: ColumnKey = 'no';

// Two-word headers: first word → [second-word pattern, column key].
const TWO_WORD_HEADERS: Record<string, { second: RegExp; key: ColumnKey }> = {
  Total: { second: /^Tm$/, key: 'total' },
  Best: { second: /^Tm$/, key: 'best' },
  In: { second: /^Lap$/, key: 'inlap' },
};

// Detect a header line: must contain Pos + Name + Make + Sponsor.
function isHeaderLine(text: string): boolean {
  return /\bPos\b/.test(text) && /\bName\b/.test(text) && /\bMake\b/.test(text) && /\bSponsor\b/.test(text);
}

function buildColumns(line: Line): Column[] {
  const cols: Column[] = [];
  const words = line.words;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const single = SINGLE_WORD_HEADERS[w.text];
    if (single) {
      cols.push({ key: single, centre: (w.left + w.right) / 2 });
      continue;
    }
    if (w.text === 'No.') {
      cols.push({ key: NO_DOT_KEY, centre: (w.left + w.right) / 2 });
      continue;
    }
    const two = TWO_WORD_HEADERS[w.text];
    if (two && words[i + 1] && two.second.test(words[i + 1].text)) {
      const next = words[i + 1];
      cols.push({ key: two.key, centre: (w.left + next.right) / 2 });
      i += 1;
      continue;
    }
  }
  // Stable sort by x — redundant given TSV left-order, but explicit for safety.
  cols.sort((a, b) => a.centre - b.centre);
  return cols;
}

// Assign a word to its nearest column. Words belong to whichever column centre
// they're closest to; ties go left.
function assignColumn(word: Word, cols: Column[]): ColumnKey {
  const wCentre = (word.left + word.right) / 2;
  let best: Column = cols[0];
  let bestDelta = Math.abs(wCentre - best.centre);
  for (let i = 1; i < cols.length; i++) {
    const d = Math.abs(wCentre - cols[i].centre);
    if (d < bestDelta) {
      best = cols[i];
      bestDelta = d;
    }
  }
  return best.key;
}

function cellsForLine(line: Line, cols: Column[]): Record<ColumnKey, string> {
  const acc: Partial<Record<ColumnKey, string[]>> = {};
  for (const w of line.words) {
    const key = assignColumn(w, cols);
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(w.text);
  }
  const out = {} as Record<ColumnKey, string>;
  for (const key of Object.keys(acc) as ColumnKey[]) {
    out[key] = (acc[key] ?? []).join(' ').trim();
  }
  return out;
}

// ─── Value parsers ──────────────────────────────────────────────────────────

// Parse "1:24.406" / "45.123" / "17:05.357" / "6.630" → milliseconds.
// Also handles "2.921" (race gap under a minute).
function parseTimeMs(raw: string | undefined): number | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  const m = s.match(/^(?:(\d+):)?(\d+)\.(\d+)$/);
  if (!m) return null;
  const minutes = m[1] ? Number(m[1]) : 0;
  const seconds = Number(m[2]);
  const fractional = m[3].padEnd(3, '0').slice(0, 3);
  const fractionalMs = Number(fractional);
  return minutes * 60_000 + seconds * 1000 + fractionalMs;
}

function parseLapsDown(raw: string | undefined): number | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d+)\s+Lap(s)?$/i);
  return m ? Number(m[1]) : null;
}

function classifyStatus(posRaw: string, diffRaw: string): RowStatus {
  const tags = [posRaw, diffRaw].map((s) => (s || '').trim().toUpperCase());
  if (tags.includes('DNS')) return 'dns';
  if (tags.includes('DQ') || tags.includes('DSQ')) return 'dsq';
  if (tags.includes('DNF')) return 'dnf';
  return 'classified';
}

// ─── Main parser ────────────────────────────────────────────────────────────

function parseSessionPdf(text: string): SessionResultRow[] {
  const words = parseTsvWords(text);
  const lines = groupLines(words);
  const headerIndex = lines.findIndex((l) => isHeaderLine(l.text));
  if (headerIndex < 0) return [];
  const header = lines[headerIndex];
  const cols = buildColumns(header);
  if (cols.length < 4) return [];

  const rows: SessionResultRow[] = [];
  let sawNotClassified = false;

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const text = line.text.trim();
    if (!text) continue;
    if (/^Not\s+classified/i.test(text)) {
      sawNotClassified = true;
      continue;
    }
    // A data row must start with a number, DNF, DQ, DSQ, or DNS. Anything
    // else is footer / announcements and we bail out once we've started.
    if (!/^\s*(?:\d+|DNF|DQ|DSQ|DNS)\b/.test(text)) {
      if (rows.length > 0) break;
      continue;
    }

    const cells = cellsForLine(line, cols);
    const posRaw = (cells.pos ?? '').trim();
    const diffRaw = (cells.diff ?? '').trim();
    const totalRaw = (cells.total ?? '').trim();
    const bestRaw = (cells.best ?? '').trim();
    const noRaw = (cells.no ?? '').trim();
    const nameRaw = (cells.name ?? '').trim();
    const makeRaw = (cells.make ?? '').trim();
    const inLapRaw = (cells.inlap ?? '').trim();
    const sponsorRaw = (cells.sponsor ?? '').trim();

    const position = /^\d+$/.test(posRaw) ? Number(posRaw) : null;
    const lapsDown = parseLapsDown(diffRaw);
    let status: RowStatus;
    if (lapsDown != null && !sawNotClassified) {
      status = 'lapped';
    } else {
      status = classifyStatus(posRaw, diffRaw);
    }

    rows.push({
      position,
      status,
      rider_name: nameRaw,
      rider_number: /^\d+$/.test(noRaw) ? Number(noRaw) : null,
      team: sponsorRaw || null,
      bike_make: makeRaw || null,
      best_lap_ms: parseTimeMs(bestRaw),
      total_time_ms: parseTimeMs(totalRaw),
      gap_to_leader_ms: lapsDown != null ? null : parseTimeMs(diffRaw),
      laps_down: lapsDown,
      best_lap_in_lap: /^\d+$/.test(inLapRaw) ? Number(inLapRaw) : null,
    });
  }

  return rows;
}

// ─── Orchestration ──────────────────────────────────────────────────────────

const here = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(here, 'output', 'event-pdfs.json');
const outputPath = join(here, 'output', 'session-results.json');

async function readManifest(): Promise<Manifest> {
  const { readFile } = await import('node:fs/promises');
  const raw = await readFile(manifestPath, 'utf8');
  return JSON.parse(raw) as Manifest;
}

async function main(): Promise<void> {
  const manifest = await readManifest();
  const sessions: SessionResult[] = [];
  let parsed = 0;
  let skipped = 0;
  let errors = 0;

  for (const event of manifest.events) {
    for (const pdf of event.pdfs) {
      if (pdf.category !== 'res') continue;
      if (!pdf.class_slug || !pdf.class_code || !pdf.session_code) {
        skipped += 1;
        continue;
      }
      try {
        const buf = await fetchPdf(pdf.url);
        const tsv = await pdftotextTsv(buf);
        const rows = parseSessionPdf(tsv);
        if (rows.length === 0) {
          console.warn(
            `  ! no rows: ${event.event_slug} ${pdf.class_slug} ${pdf.session_code} — ${pdf.url}`,
          );
          errors += 1;
          continue;
        }
        sessions.push({
          series: 'motoamerica',
          season_year: event.season_year,
          round_number: event.round_number,
          event_slug: event.event_slug,
          track_code: event.track_code,
          class_slug: pdf.class_slug,
          class_code: pdf.class_code,
          session_code: pdf.session_code,
          session_label: pdf.session_label ?? pdf.session_code,
          source_url: pdf.url,
          scraped_at: new Date().toISOString(),
          rows,
        });
        parsed += 1;
        console.log(
          `  ✓ ${event.event_slug.padEnd(10)} ${pdf.class_slug.padEnd(22)} ${pdf.session_code.padEnd(4)}  ${rows.length} rows`,
        );
      } catch (err) {
        console.warn(
          `  ! parse failed: ${event.event_slug} ${pdf.class_slug} ${pdf.session_code} — ${(err as Error).message}`,
        );
        errors += 1;
      }
    }
  }

  const result: SessionResultsFile = {
    series: 'motoamerica',
    scraped_at: new Date().toISOString(),
    sessions,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n', 'utf8');

  console.log(`\n✓ parse complete  parsed=${parsed}  skipped=${skipped}  errors=${errors}`);
  console.log(`  wrote ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
