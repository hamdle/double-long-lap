import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FilterChrome } from '../../components/filter-chrome/filter-chrome';
import {
  getCurrentSeasonYear,
  getEventPdfs,
  getMostRecentEventWithPdfs,
  type EventPdfGroup,
} from '../../data/data';
import { SeoService } from '../../seo/seo.service';

type YearGroup = {
  year: number;
  events: EventPdfGroup[];
};

@Component({
  selector: 'dll-results-index',
  imports: [RouterLink, FilterChrome],
  templateUrl: './results-index.html',
  styleUrl: './results-index.scss',
})
export class ResultsIndex implements OnInit {
  private readonly seo = inject(SeoService);

  readonly currentYear = getCurrentSeasonYear();
  readonly mostRecent = getMostRecentEventWithPdfs();

  readonly yearGroups = computed<YearGroup[]>(() => {
    const manifest = getEventPdfs();
    const byYear = new Map<number, EventPdfGroup[]>();
    for (const e of manifest.events) {
      const bucket = byYear.get(e.season_year);
      if (bucket) bucket.push(e);
      else byYear.set(e.season_year, [e]);
    }
    return Array.from(byYear.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, events]) => ({
        year,
        events: events.slice().sort((a, b) => b.round_number - a.round_number),
      }));
  });

  ngOnInit(): void {
    this.seo.setMeta({
      title: 'Results',
      description: 'Race-by-race MotoAmerica results — every session PDF, every class, every round.',
      canonical: '/results',
    });
  }
}
