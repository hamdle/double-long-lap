import type { RedirectFunction, Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { StandingsIndex } from './pages/standings-index/standings-index';
import { StandingsClass } from './pages/standings-class/standings-class';
import { ScheduleIndex } from './pages/schedule-index/schedule-index';
import { ScheduleEvent } from './pages/schedule-event/schedule-event';
import { ResultsIndex } from './pages/results-index/results-index';
import { ResultsEvent } from './pages/results-event/results-event';
import { RidersIndex } from './pages/riders-index/riders-index';
import { RiderProfile } from './pages/rider-profile/rider-profile';
import { VenuesIndex } from './pages/venues-index/venues-index';
import { VenueDetail } from './pages/venue-detail/venue-detail';
import { VenueTravel } from './pages/venue-travel/venue-travel';
import { getCurrentSeasonYear } from './data/data';

// /standings/:classSlug → /standings/{currentYear}/:classSlug so old links
// stay live after we introduced year-scoped standings routes.
const redirectClassToCurrentYear: RedirectFunction = (route) => {
  const slug = route.params['classSlug'] ?? '';
  return `/standings/${getCurrentSeasonYear()}/${slug}`;
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

  { path: 'riders', component: RidersIndex },
  { path: 'riders/:slug', component: RiderProfile },

  { path: 'venues', component: VenuesIndex },
  { path: 'venues/:slug/travel', component: VenueTravel },
  { path: 'venues/:slug', component: VenueDetail },
];
