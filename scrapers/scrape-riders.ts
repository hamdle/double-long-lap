// Scrape the rider roster from motoamerica.com/riders.
//
// Each rider card on that page is a <li class="lhea-hero lhea-team-X lhea-team-Y">
// with:
//   <h2 class="lhea-member-name">#<number> <name></h2>
//   <div class="lhea-member-excerpt">
//     <p>Team: ...<br/>Birthday: ...<br/>Hometown: ..., State/Country<br/>
//        Height/Weight: ...<br/>Motorcycle: brand + model</p>
//   </div>
// Class filter tags live on the <li> (lhea-team-<slug>) and map to our own slugs.
//
// Nationality is not published directly. We derive it from the hometown:
//   - if the trailing token is a US state (full name or abbreviation) → United States
//   - else the trailing token is treated as the country (e.g. "South Africa", "Mexico")
// This is a best-effort heuristic and can be overridden per rider in a follow-up
// if hometowns start coming back formatted inconsistently.

import { load } from "cheerio";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchText } from "./lib/fetch.ts";
import { slugify } from "./lib/slug.ts";

const RIDERS_URL = "https://www.motoamerica.com/riders/";

// MA's filter slug → our canonical class slug. Kept explicit because MA uses the
// pre-2026 sponsor-free short names while we use the fully-sponsored slugs in
// standings.json (e.g. "king-of-the-baggers" vs "mission-king-of-the-baggers").
const CLASS_SLUG_MAP: Record<string, string> = {
  superbike: "superbike",
  supersport: "supersport",
  "talent-cup": "talent-cup",
  "twins-cup": "twins-cup",
  "king-of-the-baggers": "mission-king-of-the-baggers",
  "super-hooligan": "mission-super-hooligan",
};

const US_STATES = new Set<string>([
  "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut",
  "delaware", "florida", "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa",
  "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts", "michigan",
  "minnesota", "mississippi", "missouri", "montana", "nebraska", "nevada",
  "new hampshire", "new jersey", "new mexico", "new york", "north carolina",
  "north dakota", "ohio", "oklahoma", "oregon", "pennsylvania", "rhode island",
  "south carolina", "south dakota", "tennessee", "texas", "utah", "vermont",
  "virginia", "washington", "west virginia", "wisconsin", "wyoming",
  "district of columbia",
  // abbreviations
  "al", "ak", "az", "ar", "ca", "co", "ct", "de", "fl", "ga", "hi", "id", "il", "in",
  "ia", "ks", "ky", "la", "me", "md", "ma", "mi", "mn", "ms", "mo", "mt", "ne", "nv",
  "nh", "nj", "nm", "ny", "nc", "nd", "oh", "ok", "or", "pa", "ri", "sc", "sd", "tn",
  "tx", "ut", "vt", "va", "wa", "wv", "wi", "wy", "dc",
]);

function normalizeCountry(token: string): string {
  const t = token.trim();
  if (US_STATES.has(t.toLowerCase())) return "United States";
  // Common casual forms → canonical names
  const lc = t.toLowerCase();
  if (lc === "usa" || lc === "u.s.a." || lc === "us" || lc === "u.s.") return "United States";
  if (lc === "uk" || lc === "u.k." || lc === "england" || lc === "scotland" || lc === "wales")
    return "United Kingdom";
  return t;
}

function deriveNationality(hometown: string | null): string | null {
  if (!hometown) return null;
  const parts = hometown.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const tail = parts[parts.length - 1];
  return normalizeCountry(tail);
}

function deriveManufacturer(bike: string | null): string | null {
  if (!bike) return null;
  const trimmed = bike.trim();
  // Harley-Davidson is the only multi-word OEM we routinely see.
  if (/^harley[- ]davidson/i.test(trimmed)) return "Harley-Davidson";
  const first = trimmed.split(/\s+/)[0];
  return first || null;
}

type Rider = {
  slug: string;
  number: number | null;
  name: string;
  team: string | null;
  hometown: string | null;
  nationality: string | null;
  bike: string | null;
  bike_manufacturer: string | null;
  class_slugs: string[];
};

function parseRiderCard(
  liHtml: string,
  liClassAttr: string,
): Rider | null {
  const $ = load(liHtml, null, false);
  const heading = $(".lhea-member-name").first().text().trim();
  if (!heading) return null;

  // Heading is "#<num> <name>" — number may be missing for support riders.
  const numMatch = heading.match(/^#\s*(\d+)\s+(.+)$/);
  let number: number | null = null;
  let name = heading;
  if (numMatch) {
    number = Number.parseInt(numMatch[1], 10);
    name = numMatch[2].trim();
  } else {
    name = heading.replace(/^#\s*/, "").trim();
  }

  // Excerpt is a single <p> with <br/>-separated labeled lines.
  const excerptHtml = $(".lhea-member-excerpt p").first().html() ?? "";
  const lines = excerptHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .split("\n")
    .map((ln) => load(`<p>${ln}</p>`, null, false)("p").text().trim())
    .filter(Boolean);

  const fields: Record<string, string> = {};
  for (const ln of lines) {
    const m = ln.match(/^([A-Za-z/ ]+):\s*(.+)$/);
    if (!m) continue;
    fields[m[1].trim().toLowerCase()] = m[2].trim();
  }

  const team = fields["team"] ?? null;
  const hometown = fields["hometown"] ?? null;
  const bike = fields["motorcycle"] ?? null;

  const class_slugs: string[] = [];
  for (const cls of liClassAttr.split(/\s+/)) {
    const m = cls.match(/^lhea-team-(.+)$/);
    if (!m) continue;
    const mapped = CLASS_SLUG_MAP[m[1]];
    if (mapped && !class_slugs.includes(mapped)) class_slugs.push(mapped);
  }

  return {
    slug: slugify(name),
    number,
    name,
    team,
    hometown,
    nationality: deriveNationality(hometown),
    bike,
    bike_manufacturer: deriveManufacturer(bike),
    class_slugs,
  };
}

async function main() {
  const html = await fetchText(RIDERS_URL);
  const $ = load(html);

  const riders: Rider[] = [];
  $("li.lhea-hero").each((_, li) => {
    const classAttr = $(li).attr("class") ?? "";
    const innerHtml = $.html(li) ?? "";
    const rider = parseRiderCard(innerHtml, classAttr);
    if (rider) riders.push(rider);
  });

  // De-dupe by slug (some riders appear in multiple class sections in a single page).
  const bySlug = new Map<string, Rider>();
  for (const r of riders) {
    const existing = bySlug.get(r.slug);
    if (!existing) bySlug.set(r.slug, r);
    else {
      for (const c of r.class_slugs) {
        if (!existing.class_slugs.includes(c)) existing.class_slugs.push(c);
      }
    }
  }
  const merged = Array.from(bySlug.values()).sort((a, b) => a.name.localeCompare(b.name));

  const result = {
    series: "motoamerica",
    source_url: RIDERS_URL,
    scraped_at: new Date().toISOString(),
    riders: merged,
  };

  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = join(here, "output");
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, "riders.json");
  await writeFile(outPath, JSON.stringify(result, null, 2) + "\n", "utf8");

  console.log(`Scraped ${merged.length} rider profiles from ${RIDERS_URL}`);
  const byClass = new Map<string, number>();
  for (const r of merged)
    for (const cs of r.class_slugs) byClass.set(cs, (byClass.get(cs) ?? 0) + 1);
  for (const [cs, n] of Array.from(byClass.entries()).sort())
    console.log(`  ${cs.padEnd(32)} ${n}`);
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
