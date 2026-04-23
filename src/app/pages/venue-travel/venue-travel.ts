import { Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AffiliateBlock } from '../../components/affiliate-block/affiliate-block';
import { getVenue } from '../../data/data';
import {
  TRAVEL_GUIDES,
  hasTravelGuide,
  type TravelGuide,
  type TravelGuideSlug,
} from '../../data/travel-guides';
import { SeoService } from '../../seo/seo.service';

@Component({
  selector: 'dll-venue-travel',
  imports: [RouterLink, AffiliateBlock],
  templateUrl: './venue-travel.html',
  styleUrl: './venue-travel.scss',
})
export class VenueTravel {
  private readonly seo = inject(SeoService);

  readonly slug = input.required<string>();

  readonly notFound = computed(() => !hasTravelGuide(this.slug()));
  readonly guide = computed<TravelGuide | null>(() =>
    hasTravelGuide(this.slug()) ? TRAVEL_GUIDES[this.slug() as TravelGuideSlug] : null,
  );
  readonly venue = computed(() => getVenue(this.slug()));
  readonly backLabel = computed(() => `← ${this.venue()?.location ?? 'Back to venue'}`);

  constructor() {
    effect(() => {
      const g = this.guide();
      if (!g) {
        this.seo.setMeta({
          title: 'Travel guide',
          canonical: `/venues/${this.slug()}/travel`,
        });
        return;
      }
      this.seo.setMeta({
        title: g.title,
        description: g.subtitle,
        canonical: `/venues/${this.slug()}/travel`,
      });
    });
  }
}
