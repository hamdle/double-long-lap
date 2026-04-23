import { Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { AffiliateBlock } from '../../components/affiliate-block/affiliate-block';
import { getClassGuideSupplement } from '../../data/class-guides';
import { getRider, getRosterRider } from '../../data/data';
import { SITE_BASE_URL, SeoService } from '../../seo/seo.service';

type ClassChip = { slug: string; label: string };

@Component({
  selector: 'dll-rider-profile',
  imports: [RouterLink, TableModule, AffiliateBlock],
  templateUrl: './rider-profile.html',
  styleUrl: './rider-profile.scss',
})
export class RiderProfile {
  private readonly seo = inject(SeoService);

  readonly slug = input.required<string>();

  readonly rider = computed(() => getRider(this.slug()));
  readonly roster = computed(() => getRosterRider(this.slug()));
  readonly notFound = computed(() => this.rider() == null);

  readonly classChips = computed<ClassChip[]>(() => {
    const r = this.roster();
    if (!r) return [];
    return r.class_slugs.map((classSlug) => ({
      slug: classSlug,
      label: getClassGuideSupplement(classSlug)?.display_name ?? classSlug,
    }));
  });

  readonly affiliateTitle = computed(() => {
    const r = this.rider();
    return r ? `Gear ${r.name} rides with` : 'Gear';
  });

  readonly affiliateBlurb = computed(() => {
    const r = this.rider();
    const bike = r?.bike || 'bike';
    return `Shop the ${bike} ecosystem — helmets, leathers, parts.`;
  });

  constructor() {
    effect(() => {
      const r = this.rider();
      if (!r) {
        this.seo.setMeta({
          title: 'Rider not found',
          canonical: `/riders/${this.slug()}`,
        });
        return;
      }
      this.seo.setMeta({
        title: `${r.name} — Rider Profile`,
        description: `MotoAmerica rider profile for ${r.name}.`,
        canonical: `/riders/${r.slug}`,
      });
      this.seo.setJsonLd(
        {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: r.name,
          url: `${SITE_BASE_URL}/riders/${r.slug}`,
          jobTitle: 'Motorcycle Racer',
          knowsAbout: 'MotoAmerica',
          ...(r.bike ? { affiliation: { '@type': 'Organization', name: r.bike } } : {}),
        },
        'rider',
      );
    });
  }
}
