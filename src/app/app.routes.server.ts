import { PrerenderFallback, RenderMode, type ServerRoute } from '@angular/ssr';
import {
  getAllRiders,
  getEventPdfYears,
  getEventPdfs,
  getKnownClassSlugs,
  getSchedule,
} from './data/data';
import { TRAVEL_GUIDE_SLUGS } from './data/travel-guides';

// Prerender every route at build time. Parameterized paths enumerate their
// param sets via `getPrerenderParams`; non-prerendered slugs return nothing
// (PrerenderFallback.None) — appropriate for pure static export to GH Pages.
export const serverRoutes: ServerRoute[] = [
  {
    // Legacy /standings/:classSlug still redirects to the current-year URL at
    // runtime, but we must prerender each legacy path so direct visits don't
    // 404 on static hosting. Angular captures the post-redirect HTML.
    path: 'standings/:classSlug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.None,
    getPrerenderParams: async () =>
      getKnownClassSlugs().map((classSlug) => ({ classSlug })),
  },
  {
    // Year-scoped standings: prerender every (year × classSlug) combo. Pages
    // for years we don't have scraped standings for render the archive view
    // (class hero + PDF downloads) gracefully.
    path: 'standings/:year/:classSlug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.None,
    getPrerenderParams: async () => {
      const years = getEventPdfYears();
      const classes = getKnownClassSlugs();
      const params: Array<{ year: string; classSlug: string }> = [];
      for (const year of years) {
        for (const classSlug of classes) {
          params.push({ year: String(year), classSlug });
        }
      }
      return params;
    },
  },
  {
    // Per-event results page: every (year × eventSlug) pair we have PDFs for.
    path: 'results/:year/:eventSlug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.None,
    getPrerenderParams: async () =>
      getEventPdfs().events.map((e) => ({
        year: String(e.season_year),
        eventSlug: e.event_slug,
      })),
  },
  {
    path: 'schedule/:eventSlug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.None,
    getPrerenderParams: async () =>
      getSchedule().events.map((e) => ({ eventSlug: e.event_slug })),
  },
  {
    path: 'riders/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.None,
    getPrerenderParams: async () =>
      getAllRiders().map((r) => ({ slug: r.slug })),
  },
  {
    path: 'venues/:slug/travel',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.None,
    getPrerenderParams: async () =>
      TRAVEL_GUIDE_SLUGS.map((slug) => ({ slug })),
  },
  {
    path: 'venues/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.None,
    getPrerenderParams: async () =>
      getSchedule().events.map((e) => ({ slug: e.event_slug })),
  },
  // Static (non-parameterized) routes — home, standings, schedule, results,
  // riders, venues — fall through to this catchall. The `/standings/:classSlug`
  // redirect is handled at runtime by the router (functional redirectTo), so
  // it needs no prerender entry.
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
