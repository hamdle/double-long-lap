import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from 'primeng/card';
import { Chip } from 'primeng/chip';
import { SITE_BASE_URL, SITE_NAME, SeoService } from '../../seo/seo.service';

type Section = { href: string; title: string; blurb: string };

@Component({
  selector: 'dll-home',
  imports: [RouterLink, Card, Chip],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly seo = inject(SeoService);

  readonly sections: Section[] = [
    {
      href: '/standings',
      title: 'Standings',
      blurb: 'Championship points across every MotoAmerica class.',
    },
    {
      href: '/schedule',
      title: 'Schedule',
      blurb: 'The 2026 calendar with countdown to the next round.',
    },
    {
      href: '/results',
      title: 'Results',
      blurb: 'Race-by-race results, class by class.',
    },
    {
      href: '/riders',
      title: 'Riders',
      blurb: 'Profiles, numbers, teams, career highlights.',
    },
    {
      href: '/venues',
      title: 'Venues',
      blurb: 'Track info, travel guides, track day availability.',
    },
  ];

  ngOnInit(): void {
    this.seo.setMeta({
      title: 'Double Long Lap — MotoAmerica fan hub',
      template: false,
      description:
        'Standings, schedule, results, rider profiles, venue guides, and stats for MotoAmerica fans.',
      canonical: '/',
    });
    this.seo.setJsonLd(
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_BASE_URL,
        description:
          'Standings, schedule, results, rider profiles, venue guides, and stats for MotoAmerica fans.',
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_BASE_URL,
        },
      },
      'site',
    );
  }
}
