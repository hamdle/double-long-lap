import { PrerenderFallback, RenderMode, type ServerRoute } from '@angular/ssr';
import { getAllRiders, getKnownClassSlugs, getSchedule } from './data/data';
import { TRAVEL_GUIDE_SLUGS } from './data/travel-guides';

// Prerender every route at build time. Parameterized paths enumerate their
// param sets via `getPrerenderParams`; non-prerendered slugs return nothing
// (PrerenderFallback.None) — appropriate for pure static export to GH Pages.
export const serverRoutes: ServerRoute[] = [
  {
    path: 'standings/:classSlug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.None,
    getPrerenderParams: async () =>
      getKnownClassSlugs().map((classSlug) => ({ classSlug })),
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
  // riders, venues — fall through to this catchall.
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
