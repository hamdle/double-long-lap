import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from 'primeng/card';
import { Chip } from 'primeng/chip';
import { Sponsorship } from '../../components/sponsorship/sponsorship';
import { CLASS_GUIDES } from '../../data/class-guides';
import {
  getClassGuide,
  getStandings,
  type ClassGuide,
  type ClassStandings,
} from '../../data/data';
import { formatScrapedAt } from '../../data/event-dates';
import { SeoService } from '../../seo/seo.service';

type SeasonGroup = {
  year: number;
  isCurrent: boolean;
  classes: Array<{
    cls: ClassStandings;
    tagline: string | null;
    leader: ClassStandings['top_riders'][number] | null;
  }>;
};

@Component({
  selector: 'dll-standings-index',
  imports: [RouterLink, Card, Chip, Sponsorship],
  templateUrl: './standings-index.html',
  styleUrl: './standings-index.scss',
})
export class StandingsIndex implements OnInit {
  private readonly seo = inject(SeoService);

  private readonly data = getStandings();

  readonly scrapedAt = formatScrapedAt(this.data.scraped_at);
  readonly sourceUrl = this.data.source_url;

  readonly seasons: SeasonGroup[] = this.buildSeasons();
  readonly guideOnly: ClassGuide[] = this.buildGuideOnly();

  // Equality wins consistently for non-empty arrays in templates.
  readonly hasGuideOnly = computed(() => this.guideOnly.length > 0);

  ngOnInit(): void {
    this.seo.setMeta({
      title: 'Standings',
      description: 'MotoAmerica championship standings across every class.',
      canonical: '/standings',
    });
  }

  private buildSeasons(): SeasonGroup[] {
    const bySeason = new Map<number, ClassStandings[]>();
    for (const c of this.data.classes) {
      const year = c.season_year ?? 0;
      const list = bySeason.get(year) ?? [];
      list.push(c);
      bySeason.set(year, list);
    }
    const years = Array.from(bySeason.keys()).sort((a, b) => b - a);
    const currentSeason = years[0];

    return years.map((year) => ({
      year,
      isCurrent: year === currentSeason,
      classes: (bySeason.get(year) ?? []).map((cls) => ({
        cls,
        tagline: getClassGuide(cls.class_slug)?.tagline ?? null,
        leader: cls.top_riders[0] ?? null,
      })),
    }));
  }

  private buildGuideOnly(): ClassGuide[] {
    const scrapedSlugs = new Set(this.data.classes.map((c) => c.class_slug));
    return CLASS_GUIDES
      .filter((g) => !scrapedSlugs.has(g.class_slug))
      .map((g) => getClassGuide(g.class_slug))
      .filter((g): g is ClassGuide => g !== null);
  }
}
