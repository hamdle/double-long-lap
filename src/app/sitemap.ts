import type { MetadataRoute } from "next";
import { getAllRiders, getSchedule, getStandings } from "@/lib/data";
import { TRAVEL_GUIDE_SLUGS } from "@/lib/travel-guides";

const BASE = "https://doublelonglap.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [standings, schedule, riders] = await Promise.all([
    getStandings(),
    getSchedule(),
    getAllRiders(),
  ]);

  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/standings`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/schedule`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/riders`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/venues`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/results`, lastModified, changeFrequency: "weekly", priority: 0.5 },
  ];

  const classRoutes: MetadataRoute.Sitemap = standings.classes.map((c) => ({
    url: `${BASE}/standings/${c.class_slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const eventRoutes: MetadataRoute.Sitemap = schedule.events.map((e) => ({
    url: `${BASE}/schedule/${e.event_slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const venueRoutes: MetadataRoute.Sitemap = schedule.events.map((e) => ({
    url: `${BASE}/venues/${e.event_slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const travelRoutes: MetadataRoute.Sitemap = TRAVEL_GUIDE_SLUGS.map((slug) => ({
    url: `${BASE}/venues/${slug}/travel`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const riderRoutes: MetadataRoute.Sitemap = riders.map((r) => ({
    url: `${BASE}/riders/${r.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...classRoutes,
    ...eventRoutes,
    ...venueRoutes,
    ...travelRoutes,
    ...riderRoutes,
  ];
}
