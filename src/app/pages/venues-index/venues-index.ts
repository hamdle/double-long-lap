import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from 'primeng/card';
import { Chip } from 'primeng/chip';
import { getSchedule, type ScheduleEvent } from '../../data/data';
import { hasTravelGuide } from '../../data/travel-guides';
import { SeoService } from '../../seo/seo.service';

type VenueRow = {
  event: ScheduleEvent;
  hasGuide: boolean;
};

@Component({
  selector: 'dll-venues-index',
  imports: [RouterLink, Card, Chip],
  templateUrl: './venues-index.html',
  styleUrl: './venues-index.scss',
})
export class VenuesIndex implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly data = getSchedule();

  readonly seasonYear = this.data.season_year;

  // Dedupe by location — same logic as the legacy page (a venue may host
  // multiple events in a season, but only show one card per physical track).
  readonly venues: VenueRow[] = Array.from(
    new Map(this.data.events.map((e) => [e.location, e])).values(),
  ).map((event) => ({ event, hasGuide: hasTravelGuide(event.event_slug) }));

  ngOnInit(): void {
    this.seo.setMeta({
      title: 'Venues',
      description: 'MotoAmerica track info, travel guides, and track day availability.',
      canonical: '/venues',
    });
  }
}
