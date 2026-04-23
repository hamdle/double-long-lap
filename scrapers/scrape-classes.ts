// Scrape per-class rule sheets (engine / weight / age) from motoamerica.com class pages.
//
// Each class has its own page like /superbikes/, /supersport/, /twins-cup/, and the
// same Elementor-widget block structure:
//   <div class="elementor-widget-container">
//     <p><strong>Engine Configurations:</strong><br/>line<br/>line</p>
//     <p><strong>Minimum Weight:</strong><br/>value</p>
//     <p><strong>Rider Age Limit:</strong><br/>range</p>
//   </div>
// The <meta property="og:description"> on each page gives us a usable blurb.
//
// Classes without a rule block (BTR — a spec program, not a rule-written class) are
// intentionally absent from the scrape; the UI falls back to authored copy in
// src/data/class-guides.ts.
//
// Class slug ↔ page URL mapping is explicit below because MA's URL structure doesn't
// match our slugs one-to-one (e.g. superbike class page is /superbikes/, KOTB is /kotb/).

import { load } from "cheerio";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchText } from "./lib/fetch.ts";

const SOURCES: Array<{ class_slug: string; url: string }> = [
  { class_slug: "superbike", url: "https://www.motoamerica.com/superbikes/" },
  { class_slug: "supersport", url: "https://www.motoamerica.com/supersport/" },
  { class_slug: "twins-cup", url: "https://www.motoamerica.com/twins-cup/" },
  { class_slug: "talent-cup", url: "https://www.motoamerica.com/talent-cup/" },
  {
    class_slug: "mission-king-of-the-baggers",
    url: "https://www.motoamerica.com/kotb/",
  },
  {
    class_slug: "mission-super-hooligan",
    url: "https://www.motoamerica.com/super-hooligan/",
  },
];

type ClassRules = {
  class_slug: string;
  source_url: string;
  blurb: string | null;
  engine_configurations: string | null;
  minimum_weight: string | null;
  rider_age_limit: string | null;
};

function cleanText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

// Extract the text that follows a <strong>Label:</strong> inside a <p>.
// The MA pages use <br/> to separate lines; we preserve those as newlines so the UI
// can render multi-line specs (Superbike has two engine lines + a horsepower line).
function extractLabeledBlock(html: string, label: string): string | null {
  const $ = load(html, null, false);
  let found: string | null = null;
  $("p").each((_, p) => {
    if (found) return;
    const $p = $(p);
    const strong = $p.find("strong").first();
    if (!strong.length) return;
    const labelText = strong.text().replace(/\s+/g, " ").trim().replace(/:$/, "");
    if (labelText.toLowerCase() !== label.toLowerCase()) return;
    // Replace <br> with \n then strip the leading label to leave just the value.
    const paragraphHtml = $p.html() ?? "";
    const withLineBreaks = paragraphHtml.replace(/<br\s*\/?>/gi, "\n");
    const $p2 = load(`<p>${withLineBreaks}</p>`, null, false)("p");
    $p2.find("strong").first().remove();
    const text = $p2
      .text()
      .split("\n")
      .map((ln) => ln.trim())
      .filter(Boolean)
      .join("\n");
    found = text || null;
  });
  return found;
}

function parseClassPage(class_slug: string, url: string, html: string): ClassRules {
  const $ = load(html);

  // Prefer the first substantive prose paragraph on the page (the editorial intro
  // that sits above the rule block) rather than og:description, which WordPress
  // tends to concatenate with body text and truncate mid-sentence.
  let blurb: string | null = null;
  $(".elementor-widget-container p").each((_, el) => {
    if (blurb) return;
    const $p = $(el);
    if ($p.find("strong").length) return; // skip the rule-sheet paragraphs
    const text = cleanText($p.text());
    if (text.length < 60) return; // skip captions / one-liners
    blurb = text;
  });

  // Fallback: og:description, trimmed at the first rule-sheet marker since
  // WordPress concatenates them onto the excerpt.
  if (!blurb) {
    const og = $('meta[property="og:description"]').attr("content")?.trim() || null;
    if (og) {
      let cut = og.replace(/\s*\[(?:…|&hellip;|\.\.\.)\]\s*$/, "");
      cut = cut.split(
        /\s*(?:Engine Configurations?|Minimum Weight|Rider Age Limit)\s*:/i,
      )[0];
      blurb = cleanText(cut);
    }
  }

  // The rule block lives inside a specific elementor-widget-container. Rather than
  // hunting that exact container (Elementor IDs drift), search every widget container
  // for the first one that contains a <p><strong>Engine Configurations:</strong></p>.
  let containerHtml: string | null = null;
  $(".elementor-widget-container").each((_, el) => {
    if (containerHtml) return;
    const inner = $(el).html() ?? "";
    if (/<strong>\s*Engine Configurations?\s*:/i.test(inner)) {
      containerHtml = inner;
    }
  });

  const engine = containerHtml ? extractLabeledBlock(containerHtml, "Engine Configurations") : null;
  const weight = containerHtml ? extractLabeledBlock(containerHtml, "Minimum Weight") : null;
  const age = containerHtml ? extractLabeledBlock(containerHtml, "Rider Age Limit") : null;

  return {
    class_slug,
    source_url: url,
    blurb,
    engine_configurations: engine,
    minimum_weight: weight,
    rider_age_limit: age,
  };
}

async function main() {
  const classes: ClassRules[] = [];
  for (const { class_slug, url } of SOURCES) {
    const html = await fetchText(url);
    classes.push(parseClassPage(class_slug, url, html));
  }

  const result = {
    series: "motoamerica",
    scraped_at: new Date().toISOString(),
    classes,
  };

  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = join(here, "output");
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, "classes.json");
  await writeFile(outPath, JSON.stringify(result, null, 2) + "\n", "utf8");

  console.log(`Scraped ${classes.length} class rule sheets`);
  for (const c of classes) {
    const hits = [
      c.blurb ? "blurb" : null,
      c.engine_configurations ? "engine" : null,
      c.minimum_weight ? "weight" : null,
      c.rider_age_limit ? "age" : null,
    ]
      .filter(Boolean)
      .join(",");
    console.log(`  ${c.class_slug.padEnd(32)} ${hits || "(no rule block found)"}`);
  }
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
