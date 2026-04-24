import type { RedirectFunction, Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { StandingsIndex } from './pages/standings-index/standings-index';
import { StandingsClass } from './pages/standings-class/standings-class';
import { ScheduleIndex } from './pages/schedule-index/schedule-index';
import { ScheduleEvent } from './pages/schedule-event/schedule-event';
import { ResultsIndex } from './pages/results-index/results-index';
import { ResultsEvent } from './pages/results-event/results-event';
import { ResultsSession, sessionUrlSegment } from './pages/results-session/results-session';
import { RidersIndex } from './pages/riders-index/riders-index';
import { RiderProfile } from './pages/rider-profile/rider-profile';
import { VenuesIndex } from './pages/venues-index/venues-index';
import { VenueDetail } from './pages/venue-detail/venue-detail';
import { VenueTravel } from './pages/venue-travel/venue-travel';
import { getCurrentSeasonYear, getSessionResultsForClass } from './data/data';

// /standings/:classSlug → /standings/{currentYear}/:classSlug so old links
// stay live after we introduced year-scoped standings routes.
const redirectClassToCurrentYear: RedirectFunction = (route) => {
  const slug = route.params['classSlug'] ?? '';
  return `/standings/${getCurrentSeasonYear()}/${slug}`;
};

// Session-code priority for the "pick best default" redirect. Prefer the
// latest race (R2) → first race (R1) → qualifying → timed practice → practice
// → warm-up, so a bare /results/:year/:event/:class URL lands on the most
// interesting session we have data for.
const SESSION_PREFERENCE = ['R2', 'R1', 'Q1', 'TP', 'P2', 'P1', 'WU'];

const redirectClassToDefaultSession: RedirectFunction = (route) => {
  const year = Number(route.params['year']);
  const eventSlug = route.params['eventSlug'] ?? '';
  const classSlug = route.params['classSlug'] ?? '';
  const available = getSessionResultsForClass(year, eventSlug, classSlug);
  if (available.length === 0) {
    // No parsed sessions — hand them back to the event page where the PDF
    // hub at least surfaces MA's official downloads for this class.
    return `/results/${year}/${eventSlug}`;
  }
  const codes = new Set(available.map((s) => s.session_code));
  const pick =
    SESSION_PREFERENCE.find((code) => codes.has(code)) ?? available[0].session_code;
  return `/results/${year}/${eventSlug}/${classSlug}/${sessionUrlSegment(pick)}`;
};

export const routes: Routes = [
  { path: '', component: Home, title: 'Double Long Lap — MotoAmerica fan hub' },

  { path: 'standings', component: StandingsIndex },
  {
    path: 'standings/:classSlug',
    redirectTo: redirectClassToCurrentYear,
    pathMatch: 'full',
  },
  { path: 'standings/:year/:classSlug', component: StandingsClass },

  { path: 'schedule', component: ScheduleIndex },
  { path: 'schedule/:eventSlug', component: ScheduleEvent },

  { path: 'results', component: ResultsIndex },
  { path: 'results/:year/:eventSlug', component: ResultsEvent },
  {
    path: 'results/:year/:eventSlug/:classSlug',
    redirectTo: redirectClassToDefaultSession,
    pathMatch: 'full',
  },
  {
    path: 'results/:year/:eventSlug/:classSlug/:session',
    component: ResultsSession,
  },

  { path: 'riders', component: RidersIndex },
  { path: 'riders/:slug', component: RiderProfile },

  { path: 'venues', component: VenuesIndex },
  { path: 'venues/:slug/travel', component: VenueTravel },
  { path: 'venues/:slug', component: VenueDetail },
];
