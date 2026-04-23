// Wire-format types for the scraper output. These mirror the JSON shapes
// in legacy-next/scripts/output/*.json and are imported by both the
// codegen-emitted generated.ts and the runtime selector helpers in data.ts.

export type Rider = {
  position: number;
  name: string;
  points: number;
  bike: string | null;
  isChampion: boolean;
};

export type RiderProfile = {
  slug: string;
  name: string;
  bike: string | null;
  appearances: Array<{
    class_name: string;
    class_slug: string;
    season_year: number | null;
    position: number;
    points: number;
    isChampion: boolean;
  }>;
};

export type ClassStandings = {
  class_name: string;
  class_slug: string;
  // The Superbike Cup row in the scraped JSON has nulls for these — its rows
  // share Superbike's session header rather than carrying their own.
  class_code: string | null;
  season_year: number | null;
  round_number: number | null;
  track_code: string | null;
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
  // Championship math (B1). Same value for every row in a class for
  // points_remaining_in_season; gap and still_alive are per-rider.
  // For roster-only rows (points == null) gap stays null and still_alive
  // defaults to true — we can't conclude elimination without point data.
  gap_to_leader: number | null;
  points_remaining_in_season: number;
  still_mathematically_alive: boolean;
};
