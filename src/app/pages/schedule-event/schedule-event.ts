import { Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { getStandings, getVenue } from '../../data/data';
import { formatDateRange } from '../../data/event-dates';
import { slugify } from '../../data/slug';
import { hasTravelGuide } from '../../data/travel-guides';
import { SITE_BASE_URL, SeoService } from '../../seo/seo.service';

type ClassPodium = {
  class_name: string;
  class_slug: string;
  top_three: Array<{ name: string; slug: string; points: number }>;
};

@Component({
  selector: 'dll-schedule-event',
  imports: [RouterLink, Card, Button],
  templateUrl: './schedule-event.html',
  styleUrl: './schedule-event.scss',
})
export class ScheduleEvent {
  private readonly seo = inject(SeoService);

  readonly eventSlug = input.required<string>();

  readonly event = computed(() => getVenue(this.eventSlug()));
  readonly notFound = computed(() => this.event() == null);
  readonly dateRange = computed(() => {
    const e = this.event();
    return e ? formatDateRange(e.start_date, e.end_date) : '';
  });
  readonly hasGuide = computed(() => hasTravelGuide(this.eventSlug()));

  readonly podiums: ClassPodium[] = getStandings().classes.map((c) => ({
    class_name: c.class_name,
    class_slug: c.class_slug,
    top_three: c.top_riders.slice(0, 3).map((r) => ({
      name: r.name,
      slug: slugify(r.name),
      points: r.points,
    })),
  }));

  constructor() {
    effect(() => {
      const e = this.event();
      if (!e) {
        this.seo.setMeta({
          title: 'Round not found',
          canonical: `/schedule/${this.eventSlug()}`,
        });
        return;
      }
      this.seo.setMeta({
        title: `${e.title} — Race Weekend Guide`,
        description: `Race weekend guide for ${e.title} at ${e.location}.`,
        canonical: `/schedule/${e.event_slug}`,
      });
      this.seo.setJsonLd(
        {
          '@context': 'https://schema.org',
          '@type': 'SportsEvent',
          name: e.title,
          startDate: e.start_date,
          endDate: e.end_date,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: { '@type': 'Place', name: e.location, address: e.location },
          url: `${SITE_BASE_URL}/schedule/${e.event_slug}`,
          sport: 'Motorcycle racing',
          organizer: {
            '@type': 'Organization',
            name: 'MotoAmerica',
            url: 'https://www.motoamerica.com/',
          },
        },
        'event',
      );
    });
  }
}
