// Scrape MotoAmerica championship standings from motoamerica.com/standings.
//
// Page structure (as of 2026-04-17): a WordPress/Elementor page that embeds one
// HTML chunk per class. Each chunk is wrapped in <div class="classes"> and
// contains:
//   <h1 align="center">Class Name</h1>
//   <ol>
//     <li>
//       <span>Rider Name</span>
//       [<span class="champ">Champion</span>]   -- only for series champion
//       <span class="points">NNN</span>
//       <span class="bike">Brand</span>
//     </li>
//     ...
//   </ol>
//   <a href=".../Results/YEAR/TRACK/YY_RR_TRACK_CLS_PTS_points.pdf">View Full Standings</a>
//
// The top-6 riders per class are shown inline; the PDF link is authoritative for
// the full field. We capture both — inline for fast rendering, PDF URL for later
// parsing by scrape-results (separate scraper).
//
// The same class can appear twice on the page (Elementor layout duplicates some
// classes across sections). We dedupe by class slug, keeping the first occurrence.
// Both copies carry identical data in practice — verified 2026-04-17.

import { load, type Cheerio } from "cheerio";
import type { Element } from "domhandler";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchText } from "./lib/fetch.ts";
import { slugify } from "./lib/slug.ts";

const STANDINGS_URL = "https://www.motoamerica.com/standings/";

// PDF URL pattern: .../Results/{year}/{trackCode}/{yy}_{round}_{trackCode}_{classCode}_PTS_points.pdf
const PDF_URL_RE =
  /\/Results\/(\d{4})\/([A-Z0-9]+)\/(\d{2})_(\d+)_([A-Z0-9]+)_([A-Z0-9]+)_PTS_points\.pdf/i;

type RiderStanding = {
  position: number;
  name: string;
  points: number;
  bike: string | null;
  isChampion: boolean;
};

type ClassStandings = {
  class_name: string;
  class_slug: string;
  class_code: string | null; // 'SBK', 'SSP', 'TCP', etc. — from PDF URL
  season_year: number | null;
  round_number: number | null;
  track_code: string | null;
  full_standings_pdf_url: string | null;
  top_riders: RiderStanding[];
};

function parseClassBlock($block: Cheerio<Element>): ClassStandings | null {
  const className = $block.find("h1").first().text().trim().replace(/\s+/g, " ");
  if (!className) return null;

  const riders: RiderStanding[] = [];
  $block.find("ol > li").each((i, li) => {
    const $li = load(li)("li");
    // Name: first <span> whose class is neither "points" nor "bike" nor "champ"
    // — order isn't guaranteed, so classify each span explicitly.
    let name = "";
    let points = NaN;
    let bike: string | null = null;
    let isChampion = false;
    $li.find("> span").each((_, span) => {
      const $s = load(span)("span");
      const cls = $s.attr("class") ?? "";
      const text = $s.text().trim();
      if (cls.includes("points")) points = Number.parseInt(text, 10);
      else if (cls.includes("bike")) bike = text || null;
      else if (cls.includes("champ")) isChampion = /champion/i.test(text);
      else if (!name) name = text;
    });
    if (!name || Number.isNaN(points)) return;
    riders.push({ position: i + 1, name: name.replace(/\s+/g, " "), points, bike, isChampion });
  });

  if (riders.length === 0) return null;

  // First "View Full Standings" anchor inside this block
  const pdfHref = $block.find('a[href*="/Results/"]').first().attr("href") ?? null;
  let season_year: number | null = null;
  let round_number: number | null = null;
  let track_code: string | null = null;
  let class_code: string | null = null;
  if (pdfHref) {
    const m = pdfHref.match(PDF_URL_RE);
    if (m) {
      season_year = Number.parseInt(m[1], 10);
      round_number = Number.parseInt(m[4], 10);
      track_code = m[5];
      class_code = m[6];
    }
  }

  return {
    class_name: className,
    class_slug: slugify(className),
    class_code,
    season_year,
    round_number,
    track_code,
    full_standings_pdf_url: pdfHref,
    top_riders: riders,
  };
}

async function main() {
  const html = await fetchText(STANDINGS_URL);
  const $ = load(html);

  // Each class is a separate embedded HTML block rooted at <div class="classes">.
  // Some classes appear twice (Elementor layout duplication) — dedupe by slug.
  const seen = new Set<string>();
  const classes: ClassStandings[] = [];
  $("div.classes").each((_, el) => {
    const parsed = parseClassBlock($(el));
    if (!parsed) return;
    if (seen.has(parsed.class_slug)) return;
    seen.add(parsed.class_slug);
    classes.push(parsed);
  });

  const result = {
    series: "motoamerica",
    source_url: STANDINGS_URL,
    scraped_at: new Date().toISOString(),
    classes,
  };

  // Write snapshot. Once Supabase is wired up (Phase 1 Week 4-ish), this writes
  // directly into the standings/races tables instead.
  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = join(here, "output");
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, "standings.json");
  await writeFile(outPath, JSON.stringify(result, null, 2) + "\n", "utf8");

  console.log(`Scraped ${classes.length} classes from ${STANDINGS_URL}`);
  for (const c of classes) {
    const header = c.season_year
      ? `${c.season_year} R${c.round_number} (${c.track_code})`
      : "unknown round";
    console.log(`  ${c.class_name.padEnd(28)} ${header.padEnd(22)} top-${c.top_riders.length}`);
  }
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
