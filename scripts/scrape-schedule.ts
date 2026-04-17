// Scrape MotoAmerica 2026 race calendar.
//
// The /calendar/ page shows mostly an image; the structured data is in an iframe
// at /wp-content/Calendar/. Each event is an <article class="event-article"> with:
//   <div class="col-md-4 col-sm-4 {eventSlug}">
//     <span class="start-date">March 5 - 7</span>           -- "Month D - D" or "Month D - Month D"
//     <div class="event-loc-place">Venue Name, STATE</div>
//     <h4 class="event-title"><a class="heading" href="...">Event Title</a></h4>
//   </div>
//
// The calendar page heading says "2026 Calendar" — we hardcode SEASON_YEAR for now.
// (Parsing the parent page heading is feasible once we need multi-year scraping.)
// Cross-month ranges like "July 31 - August 2" are handled.

import { load, type Cheerio } from "cheerio";
import type { Element } from "domhandler";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchText } from "./lib/fetch.ts";
import { slugify } from "./lib/slug.ts";

const CALENDAR_IFRAME_URL = "https://www.motoamerica.com/wp-content/Calendar/";
const SEASON_YEAR = 2026;

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

type Event = {
  order: number;
  event_slug: string;           // from container class: 'atlanta', 'barber', 'newJersey'
  title: string;
  location: string;
  start_date: string;           // ISO yyyy-mm-dd
  end_date: string;             // ISO yyyy-mm-dd
  details_url: string | null;   // motoamerica.com event page
};

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDateRange(raw: string): { start: string; end: string } | null {
  // "March 5 - 7" | "July 31 - August 2" | "May 29 - 31"
  const cleaned = raw.replace(/\s+/g, " ").trim();
  // Match either "Month D - Month D" or "Month D - D"
  let m = cleaned.match(/^([A-Za-z]+)\s+(\d{1,2})\s*[-–]\s*([A-Za-z]+)\s+(\d{1,2})$/);
  if (m) {
    const mo1 = MONTHS[m[1].toLowerCase()];
    const mo2 = MONTHS[m[3].toLowerCase()];
    if (!mo1 || !mo2) return null;
    return { start: iso(SEASON_YEAR, mo1, Number(m[2])), end: iso(SEASON_YEAR, mo2, Number(m[4])) };
  }
  m = cleaned.match(/^([A-Za-z]+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
  if (m) {
    const mo = MONTHS[m[1].toLowerCase()];
    if (!mo) return null;
    return { start: iso(SEASON_YEAR, mo, Number(m[2])), end: iso(SEASON_YEAR, mo, Number(m[3])) };
  }
  return null;
}

function parseEvent($article: Cheerio<Element>, order: number, containerSlug: string | null): Event | null {
  const rawDate = $article.find(".start-date").first().text().trim();
  const range = parseDateRange(rawDate);
  if (!range) return null;

  const location = $article.find(".event-loc-place").first().text().trim().replace(/\s+/g, " ");
  const title = $article.find(".event-title .heading").first().text().trim().replace(/\s+/g, " ");
  const href = $article.find(".event-title .heading").first().attr("href") ?? null;

  if (!title || !location) return null;

  return {
    order,
    event_slug: containerSlug ?? slugify(title),
    title,
    location,
    start_date: range.start,
    end_date: range.end,
    details_url: href,
  };
}

async function main() {
  const html = await fetchText(CALENDAR_IFRAME_URL);
  const $ = load(html);

  // Cheerio drops HTML comments from the DOM, so commented-out draft events
  // (e.g. the early "talentCupMoto" stub in the source) don't show up here.
  const events: Event[] = [];
  let order = 0;
  $(".col-md-4.col-sm-4").each((_, col) => {
    const $col = $(col);
    const $article = $col.find("article.event-article");
    if ($article.length === 0) return;
    const classes = ($col.attr("class") ?? "").split(/\s+/);
    const slug = classes.find((c) => c && c !== "col-md-4" && c !== "col-sm-4") ?? null;
    const ev = parseEvent($article, order, slug);
    if (!ev) return;
    order += 1;
    events.push(ev);
  });

  // Sort by start_date — DOM order is close to chronological but not guaranteed.
  events.sort((a, b) => a.start_date.localeCompare(b.start_date));
  events.forEach((e, i) => (e.order = i + 1));

  const result = {
    series: "motoamerica",
    season_year: SEASON_YEAR,
    source_url: CALENDAR_IFRAME_URL,
    scraped_at: new Date().toISOString(),
    events,
  };

  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = join(here, "output");
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, "schedule.json");
  await writeFile(outPath, JSON.stringify(result, null, 2) + "\n", "utf8");

  console.log(`Scraped ${events.length} events for ${SEASON_YEAR} from ${CALENDAR_IFRAME_URL}`);
  for (const e of events) {
    console.log(`  ${String(e.order).padStart(2)}. ${e.start_date} → ${e.end_date}  ${e.event_slug.padEnd(14)} ${e.title}`);
  }
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
