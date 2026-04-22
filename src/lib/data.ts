import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  CLASS_GUIDES,
  getClassGuideSupplement,
  type ClassGuideSupplement,
} from "@/data/class-guides";
import { slugify } from "./slug";

export type Rider = {
  position: number;
  name: string;
  points: number;
  bike: string;
  isChampion: boolean;
};

export type RiderProfile = {
  slug: string;
  name: string;
  bike: string;
  appearances: Array<{
    class_name: string;
    class_slug: string;
    season_year: number;
    position: number;
    points: number;
    isChampion: boolean;
  }>;
};

export type ClassStandings = {
  class_name: string;
  class_slug: string;
  class_code: string;
  season_year: number;
  round_number: number;
  track_code: string;
  full_standings_pdf_url: string | null;
  top_riders: Rider[];
};

export type StandingsFile = {
  series: string;
  source_url: string;
  scraped_at: string;
  classes: ClassStandings[];
};

export type ScheduleEvent = {
  order: number;
  event_slug: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  details_url: string;
};

export type ScheduleFile = {
  series: string;
  season_year: number;
  source_url: string;
  scraped_at: string;
  events: ScheduleEvent[];
};

export type ClassRules = {
  class_slug: string;
  source_url: string;
  blurb: string | null;
  engine_configurations: string | null;
  minimum_weight: string | null;
  rider_age_limit: string | null;
};

export type ClassRulesFile = {
  series: string;
  scraped_at: string;
  classes: ClassRules[];
};

export type ClassGuide = {
  class_slug: string;
  display_name: string;
  tagline: string;
  what_you_watch: string;
  eligible_bikes: string;
  blurb: string | null;
  engine_configurations: string | null;
  minimum_weight: string | null;
  rider_age_limit: string | null;
  notes: string | null;
  source_url: string | null;
  image: { src: string; alt: string } | null;
};

export type RosterRider = {
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

export type RostersFile = {
  series: string;
  source_url: string;
  scraped_at: string;
  riders: RosterRider[];
};

// A single grid row for a class — merges points (from top-6 scrape) with roster
// detail (number, team, nationality, bike). Either side may be null; a rider
// listed in the roster but not in the points sheet shows a blank position/points,
// and vice versa.
export type ClassGridRider = {
  slug: string;
  name: string;
  position: number | null;
  number: number | null;
  team: string | null;
  nationality: string | null;
  hometown: string | null;
  bike: string | null;
  bike_manufacturer: string | null;
  points: number | null;
  isChampion: boolean;
};

const OUTPUT_DIR = path.join(process.cwd(), "scripts", "output");

async function readJson<T>(filename: string): Promise<T> {
  const filePath = path.join(OUTPUT_DIR, filename);
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") {
      throw new Error(
        `Missing scraped data file: ${filePath}\n` +
          `Run the scrape scripts before building:\n` +
          `  npm run scrape:standings\n  npm run scrape:schedule`,
      );
    }
    throw err;
  }
}

export async function getStandings(): Promise<StandingsFile> {
  return readJson<StandingsFile>("standings.json");
}

export async function getSchedule(): Promise<ScheduleFile> {
  return readJson<ScheduleFile>("schedule.json");
}

async function getClassRulesFile(): Promise<ClassRulesFile | null> {
  try {
    return await readJson<ClassRulesFile>("classes.json");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return null; // scrape is optional during dev
    throw err;
  }
}

async function getRostersFile(): Promise<RostersFile | null> {
  try {
    return await readJson<RostersFile>("riders.json");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return null;
    throw err;
  }
}

export async function getRoster(): Promise<RosterRider[]> {
  const file = await getRostersFile();
  return file?.riders ?? [];
}

// Build the class grid: union of scraped top-6 (points + position) and roster
// (number + team + nationality + bike details), keyed by rider slug.
export async function getClassGrid(classSlug: string): Promise<ClassGridRider[]> {
  const [cls, roster] = await Promise.all([getClassStandings(classSlug), getRoster()]);
  const bySlug = new Map<string, ClassGridRider>();

  for (const r of cls?.top_riders ?? []) {
    const slug = slugify(r.name);
    bySlug.set(slug, {
      slug,
      name: r.name,
      position: r.position,
      number: null,
      team: null,
      nationality: null,
      hometown: null,
      bike: r.bike || null,
      bike_manufacturer: r.bike ? r.bike.split(/\s+/)[0] : null,
      points: r.points,
      isChampion: r.isChampion,
    });
  }

  for (const r of roster) {
    if (!r.class_slugs.includes(classSlug)) continue;
    const existing = bySlug.get(r.slug);
    if (existing) {
      existing.number = r.number;
      existing.team = r.team;
      existing.nationality = r.nationality;
      existing.hometown = r.hometown;
      // Roster's bike string is more detailed (full model) — prefer it.
      if (r.bike) {
        existing.bike = r.bike;
        existing.bike_manufacturer = r.bike_manufacturer;
      }
    } else {
      bySlug.set(r.slug, {
        slug: r.slug,
        name: r.name,
        position: null,
        number: r.number,
        team: r.team,
        nationality: r.nationality,
        hometown: r.hometown,
        bike: r.bike,
        bike_manufacturer: r.bike_manufacturer,
        points: null,
        isChampion: false,
      });
    }
  }

  return Array.from(bySlug.values()).sort((a, b) => {
    // Ranked riders first (ascending position), then unranked alphabetical by name.
    if (a.position != null && b.position != null) return a.position - b.position;
    if (a.position != null) return -1;
    if (b.position != null) return 1;
    return a.name.localeCompare(b.name);
  });
}

// Merge scraped rules (authoritative for engine/weight/age) with authored
// supplement (authoritative for editorial voice and fallback values). Authored
// fallback is only used when the scrape couldn't find a value — the live page
// always wins when present.
export async function getClassGuide(classSlug: string): Promise<ClassGuide | null> {
  const supplement: ClassGuideSupplement | null = getClassGuideSupplement(classSlug);
  if (!supplement) return null;
  const rulesFile = await getClassRulesFile();
  const scraped = rulesFile?.classes.find((c) => c.class_slug === classSlug) ?? null;

  const fb = supplement.fallback ?? {};
  return {
    class_slug: supplement.class_slug,
    display_name: supplement.display_name,
    tagline: supplement.tagline,
    what_you_watch: supplement.what_you_watch,
    eligible_bikes: supplement.eligible_bikes,
    blurb: scraped?.blurb ?? fb.blurb ?? null,
    engine_configurations: scraped?.engine_configurations ?? fb.engine_configurations ?? null,
    minimum_weight: scraped?.minimum_weight ?? fb.minimum_weight ?? null,
    rider_age_limit: scraped?.rider_age_limit ?? fb.rider_age_limit ?? null,
    notes: supplement.notes ?? null,
    source_url: scraped?.source_url ?? null,
    image: supplement.image ?? null,
  };
}

export async function getClassStandings(
  classSlug: string,
): Promise<ClassStandings | null> {
  const data = await getStandings();
  return data.classes.find((c) => c.class_slug === classSlug) ?? null;
}

// Union of class slugs we render pages for: classes with scraped standings *and*
// classes that exist only as authored guides (e.g. BTR, which has no season-long
// standings on motoamerica.com).
export async function getKnownClassSlugs(): Promise<string[]> {
  const data = await getStandings();
  const slugs = new Set<string>(data.classes.map((c) => c.class_slug));
  for (const g of CLASS_GUIDES) slugs.add(g.class_slug);
  return Array.from(slugs);
}

export async function getAllRiders(): Promise<RiderProfile[]> {
  const data = await getStandings();
  const bySlug = new Map<string, RiderProfile>();
  for (const cls of data.classes) {
    for (const r of cls.top_riders) {
      const slug = slugify(r.name);
      const existing = bySlug.get(slug);
      const appearance = {
        class_name: cls.class_name,
        class_slug: cls.class_slug,
        season_year: cls.season_year,
        position: r.position,
        points: r.points,
        isChampion: r.isChampion,
      };
      if (existing) {
        existing.appearances.push(appearance);
        if (!existing.bike && r.bike) existing.bike = r.bike;
      } else {
        bySlug.set(slug, { slug, name: r.name, bike: r.bike, appearances: [appearance] });
      }
    }
  }
  return Array.from(bySlug.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRider(slug: string): Promise<RiderProfile | null> {
  const riders = await getAllRiders();
  return riders.find((r) => r.slug === slug) ?? null;
}

export async function getVenue(eventSlug: string): Promise<ScheduleEvent | null> {
  const data = await getSchedule();
  return data.events.find((e) => e.event_slug === eventSlug) ?? null;
}

export async function getNextEvent(today: Date = new Date()): Promise<ScheduleEvent | null> {
  const data = await getSchedule();
  for (const e of data.events) {
    const end = new Date(`${e.end_date}T23:59:59`);
    if (end >= today) return e;
  }
  return null;
}
