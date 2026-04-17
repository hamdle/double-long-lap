import { readFile } from "node:fs/promises";
import path from "node:path";
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

export async function getClassStandings(
  classSlug: string,
): Promise<ClassStandings | null> {
  const data = await getStandings();
  return data.classes.find((c) => c.class_slug === classSlug) ?? null;
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
