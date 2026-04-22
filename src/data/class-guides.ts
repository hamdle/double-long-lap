// Authored per-class editorial content that supplements the scraped rule sheets
// in scripts/output/classes.json. The scrape handles engine/weight/age for the
// rule-driven classes; this file supplies:
//
//   - tagline / what_you_watch — editorial voice for onboarding new fans
//   - eligible_bikes — representative machines riders bring to each class
//   - notes — subchampionship / historical-class context
//   - fallback — rule-sheet data for classes the scrape can't see (BTR) or where
//     the MA class page describes the rules in prose (KOTB, Super Hooligan)
//
// The union of scraped + authored is merged in src/lib/data.ts (getClassGuide).

export type ClassGuideSupplement = {
  class_slug: string;
  display_name: string;
  tagline: string;
  what_you_watch: string;
  eligible_bikes: string;
  notes?: string;
  image?: { src: string; alt: string };
  fallback?: {
    blurb?: string;
    engine_configurations?: string;
    minimum_weight?: string;
    rider_age_limit?: string;
  };
};

export const CLASS_GUIDES: ClassGuideSupplement[] = [
  {
    class_slug: "superbike",
    display_name: "Superbike",
    tagline: "America's premier motorcycle road racing class.",
    what_you_watch:
      "The fastest, most sophisticated machines on the grid with the country's deepest rider talent. Production-based 1000cc bikes modified to around 210 hp and capable of speeds near 200 mph. Two races per weekend, nine weekends a year, and the closest top-five battles in American road racing.",
    eligible_bikes:
      "BMW M 1000 RR · Ducati Panigale V4 R · Yamaha YZF-R1M · Suzuki GSX-R1000R · Honda CBR1000RR-R Fireblade",
  },
  {
    class_slug: "superbike-cup",
    display_name: "MotoAmerica Superbike Cup",
    tagline: "The production-trim sub-championship that runs inside Superbike.",
    what_you_watch:
      "Same grid, same 20 races as Superbike — but Cup entries run to a more production-faithful rules package and score in their own parallel championship. A Cup rider can finish on the Superbike podium and the Superbike Cup podium in the same race.",
    eligible_bikes:
      "Stock-displacement liter bikes under the Superbike Cup build rules (evolved from the former Stock 1000 regulations).",
    notes:
      "New for 2026: the former Stock 1000 class was rebranded as the Superbike Cup and folded into the Superbike grid. Uses Superbike's rule sheet below.",
  },
  {
    class_slug: "stock-1000",
    display_name: "Stock 1000",
    tagline: "The 2015–2025 production-class stepping stone to Superbike.",
    what_you_watch:
      "Run as its own standalone class through 2025, Stock 1000 showcased production-faithful liter bikes with tight build rules. 2025 was the final standalone season; the class was rebranded as the Superbike Cup in 2026.",
    eligible_bikes:
      "Stock-framed 1000cc production superbikes: Yamaha YZF-R1, BMW S 1000 RR, Suzuki GSX-R1000R, and similar.",
    notes: "Historical — see the Superbike Cup for the 2026-onward continuation.",
  },
  {
    class_slug: "supersport",
    display_name: "Supersport",
    tagline: "The middleweight championship where champions are made.",
    what_you_watch:
      "MotoAmerica's rising stars on razor-sharp middleweights. Less outright power than Superbike, but higher corner speeds and thinner margins — four- and five-rider battles decided on the last lap are the norm.",
    eligible_bikes:
      "Ducati Panigale V2 · Yamaha YZF-R6 and R9 · Triumph Street Triple 765 RS · Kawasaki ZX-6R · MV Agusta F3 800 RR",
  },
  {
    class_slug: "twins-cup",
    display_name: "Twins Cup",
    tagline: "Parallel-twin sportbikes, lighter grids, and serious upsets.",
    what_you_watch:
      "A gateway class that regularly produces the surprise pass of the weekend. Lower power means rider technique and drafts decide races, and grids are deep with club-racers stepping up to the national level.",
    eligible_bikes:
      "Aprilia RS 660 · Yamaha YZF-R7 · Kawasaki Ninja 650 · Suzuki SV650",
  },
  {
    class_slug: "talent-cup",
    display_name: "Talent Cup",
    tagline: "The official Road to MotoGP class for 14–23-year-old US riders.",
    what_you_watch:
      "Single-make, spec-series racing on purpose-built GP-style Krämer APX-350 MA machines. Identical equipment across the grid means you're watching pure rider development — the pipeline for America's next MotoGP contenders.",
    eligible_bikes: "Krämer APX-350 MA (spec bike for every rider).",
  },
  {
    class_slug: "parts-unlimited-talent-cup",
    display_name: "Parts Unlimited Talent Cup",
    tagline: "Title-sponsored era of the Talent Cup spec series.",
    what_you_watch:
      "Same rulebook and spec bike as the current Talent Cup — different title sponsor during the Parts Unlimited era. Historical championship records are kept under this name for the years it was branded.",
    eligible_bikes: "Krämer APX-350 MA (spec bike for every rider).",
    notes: "Historical — see Talent Cup for the current-era standings.",
  },
  {
    class_slug: "mission-king-of-the-baggers",
    display_name: "Mission King Of The Baggers",
    tagline: "American V-twin touring bikes. On a race track. Genuinely flat out.",
    what_you_watch:
      "Harley-Davidson and Indian bagger tourers stripped, tuned, and raced hard — a uniquely American spectacle with factory rivalry between the two brands. Full fairings, massive torque, and lean angles that shouldn't be possible on a bike this size.",
    eligible_bikes:
      "Harley-Davidson Road Glide / Street Glide · Indian Challenger RR",
    fallback: {
      engine_configurations:
        "V-twin cruiser engines from Harley-Davidson and Indian, heavily modified within a touring-bike build formula.",
      minimum_weight: "620 pounds",
      rider_age_limit: "18+",
    },
  },
  {
    class_slug: "mission-super-hooligan",
    display_name: "Mission Super Hooligan",
    tagline: "Stock-framed twins turned loose on the circuit.",
    what_you_watch:
      "Created by Roland Sands Design, Super Hooligan throws together a wild mix of naked, scrambler, and adventure-style bikes with stock frames and 750cc-and-up engines. Broad eligibility brings in brands that don't normally race — the character of the grid changes weekend to weekend.",
    eligible_bikes:
      "Harley-Davidson Nightster · KTM 890 Duke R · Yamaha XSR900 · Ducati Monster · Aprilia Tuono · Triumph Speed Triple 1200 RS",
    fallback: {
      engine_configurations: "Stock-frame production twins, 750cc and up.",
      rider_age_limit: "18+",
    },
  },
  {
    class_slug: "build-train-race",
    display_name: "Royal Enfield Build. Train. Race.",
    tagline: "MotoAmerica's women-only development series.",
    what_you_watch:
      "A focused program for female motorcyclists selected to build and race-prep their own Royal Enfield Continental GT 650 streetbikes, then learn to race them at select MotoAmerica weekends. Identical machinery, identical preparation rules — riders' own craftsmanship and technique are what separate the grid.",
    eligible_bikes: "Royal Enfield Continental GT 650 (built and prepped by each rider).",
    notes:
      "BTR runs as its own support-class feature, not a full season-long championship on the main standings page. Full-field standings are published per event rather than rolled up like the rule-driven classes.",
    fallback: {
      blurb:
        "The Royal Enfield Build. Train. Race. program selects female motorcyclists to customize and race-prep their own Royal Enfield Continental GT 650 streetbikes, then learn to race them and compete in their own feature events at select MotoAmerica race weekends.",
      engine_configurations: "648cc parallel-twin, 4-stroke (spec: Royal Enfield Continental GT 650)",
      rider_age_limit: "18+ (women only)",
    },
  },
];

export function getClassGuideSupplement(classSlug: string): ClassGuideSupplement | null {
  return CLASS_GUIDES.find((g) => g.class_slug === classSlug) ?? null;
}
