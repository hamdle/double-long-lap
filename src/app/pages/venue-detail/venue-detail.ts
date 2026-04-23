import { Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { AffiliateBlock } from '../../components/affiliate-block/affiliate-block';
import { getVenue } from '../../data/data';
import { formatDateRange } from '../../data/event-dates';
import { hasTravelGuide } from '../../data/travel-guides';
import { SeoService } from '../../seo/seo.service';

@Component({
  selector: 'dll-venue-detail',
  imports: [RouterLink, Button, AffiliateBlock],
  templateUrl: './venue-detail.html',
  styleUrl: './venue-detail.scss',
})
export class VenueDetail {
  private readonly seo = inject(SeoService);

  readonly slug = input.required<string>();

  readonly venue = computed(() => getVenue(this.slug()));
  readonly notFound = computed(() => this.venue() == null);
  readonly dateRange = computed(() => {
    const v = this.venue();
    return v ? formatDateRange(v.start_date, v.end_date) : '';
  });
  readonly hasGuide = computed(() => hasTravelGuide(this.slug()));

  constructor() {
    effect(() => {
      const v = this.venue();
      if (!v) {
        this.seo.setMeta({
          title: 'Venue not found',
          canonical: `/venues/${this.slug()}`,
        });
        return;
      }
      this.seo.setMeta({
        title: v.location,
        description: `MotoAmerica venue info for ${v.location}.`,
        canonical: `/venues/${v.event_slug}`,
      });
    });
  }
}
