import {
  CLASS_GUIDES,
  getClassGuideSupplement,
  type ClassGuideSupplement,
} from './class-guides';
import { CLASS_RULES, EVENT_PDFS, ROSTERS, SCHEDULE, SESSION_RESULTS, STANDINGS } from './generated';
import { slugify } from './slug';
import type {
  ClassGridRider,
  ClassGuide,
  ClassRulesFile,
  ClassStandings,
  EventPdf,
  EventPdfGroup,
  EventPdfsFile,
  RiderProfile,
  RosterRider,
  RostersFile,
  ScheduleEvent,
  ScheduleFile,
  SessionResult,
  SessionResultRow,
  SessionResultStatus,
  SessionResultsFile,
  StandingsFile,
} from './data-types';

export type {
  ClassGridRider,
  ClassGuide,
  ClassRulesFile,
  ClassStandings,
  EventPdf,
  EventPdfGroup,
  EventPdfsFile,
  RiderProfile,
  RosterRider,
  RostersFile,
  ScheduleEvent,
  ScheduleFile,
  SessionResult,
  SessionResultRow,
  SessionResultStatus,
  SessionResultsFile,
  StandingsFile,
};

// MotoAmerica's standard scoring assumption used everywhere on the grid:
// 25 points for a win, 2 races per round. Some support classes (Hooligan,
// KOTB) sometimes run only 1 race at a given event, but as a season constant
// the 2-races assumption is the right v1 default.
const RACES_PER_ROUND = 2;
const POINTS_FOR_WIN = 25;

export function getStandings(): StandingsFile {
  return STANDINGS;
}

// The season year the standings snapshot represents — the "current" year for
// default routing. Sourced from the scraped data (the first class's year)
// rather than hardcoded, so an offseason refresh automatically shifts it.
export function getCurrentSeasonYear(): number {
  return STANDINGS.classes.find((c) => c.season_year != null)?.season_year ?? new Date().getFullYear();
}

export function getSchedule(): ScheduleFile {
  return SCHEDULE;
}

export function getRoster(): RosterRider[] {
  return ROSTERS.riders;
}

export function getRosterRider(slug: string): RosterRider | null {
  return ROSTERS.riders.find((r) => r.slug === slug) ?? null;
}

// Build the class grid: union of scraped top-6 (points + position) and roster
// (number + team + nationality + bike details), keyed by rider slug. Also
// computes the B1 championship-math fields (gap to leader, points remaining,
// still mathematically alive) once for the class and stamps them on every row.
// When `year` is passed, returns rows only for that scraped year; years we
// haven't scraped (e.g. 2025) return an empty grid — the caller should fall
// back to the PDF archive view.
export function getClassGrid(classSlug: string, year?: number): ClassGridRider[] {
  const cls = getClassStandings(classSlug, year);
  if (year !== undefined && !cls) return [];
  const roster = getRoster();
  const schedule = getSchedule();
  const bySlug = new Map<string, ClassGridRider>();

  // Rounds left = schedule events whose end_date is today or later. Build-time
  // value — re-runs on every refresh/build, which is fine for a static site
  // refreshed alongside each round.
  const today = new Date();
  const roundsLeft = schedule.events.filter(
    (e) => new Date(`${e.end_date}T23:59:59`) >= today,
  ).length;
  const pointsRemaining = roundsLeft * RACES_PER_ROUND * POINTS_FOR_WIN;

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
      gap_to_leader: null,
      points_remaining_in_season: pointsRemaining,
      still_mathematically_alive: true,
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
        gap_to_leader: null,
        points_remaining_in_season: pointsRemaining,
        still_mathematically_alive: true,
      });
    }
  }

  // Compute gap + alive only over rows with known points. Roster-only rows
  // (points == null) keep gap=null / alive=true so we don't misrepresent
  // unknowns as eliminations.
  const rankedPoints = Array.from(bySlug.values())
    .map((r) => r.points)
    .filter((p): p is number => p != null);
  const leaderPoints = rankedPoints.length > 0 ? Math.max(...rankedPoints) : 0;
  for (const r of bySlug.values()) {
    if (r.points == null) continue;
    r.gap_to_leader = leaderPoints - r.points;
    // Strict ≤: equal means win-out-while-leader-scores-zero, still possible.
    r.still_mathematically_alive = r.gap_to_leader <= pointsRemaining;
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
export function getClassGuide(classSlug: string): ClassGuide | null {
  const supplement: ClassGuideSupplement | null = getClassGuideSupplement(classSlug);
  if (!supplement) return null;
  const scraped: ClassRulesFile['classes'][number] | null =
    CLASS_RULES.classes.find((c) => c.class_slug === classSlug) ?? null;

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

// When `year` is passed, only returns the row if its season_year matches. Years
// we don't have scraped standings for return null — callers should render an
// archive-mode view (hero + PDF downloads) rather than the grid table.
export function getClassStandings(classSlug: string, year?: number): ClassStandings | null {
  const found = STANDINGS.classes.find((c) => c.class_slug === classSlug) ?? null;
  if (!found) return null;
  if (year !== undefined && found.season_year !== year) return null;
  return found;
}

// Union of class slugs we render pages for: classes with scraped standings *and*
// classes that exist only as authored guides (e.g. BTR, which has no season-long
// standings on motoamerica.com).
export function getKnownClassSlugs(): string[] {
  const slugs = new Set<string>(STANDINGS.classes.map((c) => c.class_slug));
  for (const g of CLASS_GUIDES) slugs.add(g.class_slug);
  return Array.from(slugs);
}

export function getAllRiders(): RiderProfile[] {
  const bySlug = new Map<string, RiderProfile>();
  for (const cls of STANDINGS.classes) {
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

export function getRider(slug: string): RiderProfile | null {
  return getAllRiders().find((r) => r.slug === slug) ?? null;
}

export function getVenue(eventSlug: string): ScheduleEvent | null {
  return SCHEDULE.events.find((e) => e.event_slug === eventSlug) ?? null;
}

export function getNextEvent(today: Date = new Date()): ScheduleEvent | null {
  for (const e of SCHEDULE.events) {
    const end = new Date(`${e.end_date}T23:59:59`);
    if (end >= today) return e;
  }
  return null;
}

// ─── PDF downloads ────────────────────────────────────────────────────────────

export function getEventPdfs(): EventPdfsFile {
  return EVENT_PDFS;
}

// Return the PDF group for a given (year, eventSlug), or null if we don't have
// anything crawled for that pair. Event slugs match the app's schedule-slug
// vocabulary ('atlanta', 'barber', ...); the crawler maps MA's track codes onto
// these at scrape time.
export function getEventPdfGroup(year: number, eventSlug: string): EventPdfGroup | null {
  return (
    EVENT_PDFS.events.find(
      (g) => g.season_year === year && g.event_slug === eventSlug,
    ) ?? null
  );
}

// All PDFs for an event, filtered to a specific class. Pass classSlug=null to
// get only class-wide / event-wide PDFs. Championship-points sheets (those with
// session_code === null) are included when they match the class.
export function getEventPdfsForClass(
  year: number,
  eventSlug: string,
  classSlug: string | null,
): EventPdf[] {
  const group = getEventPdfGroup(year, eventSlug);
  if (!group) return [];
  return group.pdfs.filter((p) => p.class_slug === classSlug);
}

// Years we have any PDF data for, newest first. Drives the filter-chrome Year
// dropdown when we don't want to advertise years with nothing behind them.
export function getEventPdfYears(): number[] {
  const years = new Set<number>();
  for (const g of EVENT_PDFS.events) years.add(g.season_year);
  return Array.from(years).sort((a, b) => b - a);
}

// Rounds for a given year, ordered chronologically (by round_number). Drives
// the filter-chrome Event dropdown.
export function getEventPdfRounds(year: number): EventPdfGroup[] {
  return EVENT_PDFS.events
    .filter((g) => g.season_year === year)
    .slice()
    .sort((a, b) => a.round_number - b.round_number);
}

// ─── Session results ────────────────────────────────────────────────────────

export function getSessionResults(): SessionResultsFile {
  return SESSION_RESULTS;
}

// Lookup a single parsed session. Returns null when (year, event, class,
// session) has no parsed classification (either not published yet, or
// published but not yet re-scraped).
export function getSessionResult(
  year: number,
  eventSlug: string,
  classSlug: string,
  sessionCode: string,
): SessionResult | null {
  return (
    SESSION_RESULTS.sessions.find(
      (s) =>
        s.season_year === year &&
        s.event_slug === eventSlug &&
        s.class_slug === classSlug &&
        s.session_code === sessionCode,
    ) ?? null
  );
}

// Sessions we have parsed for a (year, event, class). Drives the Session
// dropdown in filter-chrome results mode — only offer sessions that actually
// resolve to a classification table.
export function getSessionResultsForClass(
  year: number,
  eventSlug: string,
  classSlug: string,
): SessionResult[] {
  return SESSION_RESULTS.sessions.filter(
    (s) =>
      s.season_year === year &&
      s.event_slug === eventSlug &&
      s.class_slug === classSlug,
  );
}

// Classes we've parsed sessions for at a given event. Drives the Class
// dropdown in filter-chrome results mode.
export function getClassSlugsWithSessions(year: number, eventSlug: string): string[] {
  const slugs = new Set<string>();
  for (const s of SESSION_RESULTS.sessions) {
    if (s.season_year === year && s.event_slug === eventSlug) slugs.add(s.class_slug);
  }
  return Array.from(slugs);
}

// The most-recent event we have PDFs for (highest year, highest round number).
// Drives the `/results` landing — we surface this as the default deep-link
// destination so "just show me what's new" is one click.
export function getMostRecentEventWithPdfs(): EventPdfGroup | null {
  const events = EVENT_PDFS.events;
  if (events.length === 0) return null;
  return events.reduce((latest, e) => {
    if (!latest) return e;
    if (e.season_year !== latest.season_year) return e.season_year > latest.season_year ? e : latest;
    return e.round_number > latest.round_number ? e : latest;
  }, events[0]);
}
