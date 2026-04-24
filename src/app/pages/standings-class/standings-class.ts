import { Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { ClassGuide } from '../../components/class-guide/class-guide';
import { ClassGridTable } from '../../components/class-grid-table/class-grid-table';
import { ClassNotes } from '../../components/class-notes/class-notes';
import {
  FilterChrome,
  type FilterClassOption,
} from '../../components/filter-chrome/filter-chrome';
import { PdfDownloads } from '../../components/pdf-downloads/pdf-downloads';
import { CLASS_NOTES } from '../../data/class-notes';
import {
  getClassGrid,
  getClassGuide,
  getClassStandings,
  getCurrentSeasonYear,
  getEventPdfs,
  getKnownClassSlugs,
} from '../../data/data';
import { SeoService } from '../../seo/seo.service';

@Component({
  selector: 'dll-standings-class',
  imports: [
    RouterLink,
    Button,
    ClassGuide,
    ClassGridTable,
    ClassNotes,
    FilterChrome,
    PdfDownloads,
  ],
  templateUrl: './standings-class.html',
  styleUrl: './standings-class.scss',
})
export class StandingsClass {
  private readonly seo = inject(SeoService);

  readonly classSlug = input.required<string>();
  // Accepts a URL segment; parses to a number or falls back to the current
  // year. Coerced here so the rest of the template reads a plain number.
  readonly year = input<string | undefined>(undefined);

  readonly resolvedYear = computed<number>(() => {
    const raw = this.year();
    if (!raw) return getCurrentSeasonYear();
    const n = Number(raw);
    return Number.isFinite(n) ? n : getCurrentSeasonYear();
  });

  readonly cls = computed(() => getClassStandings(this.classSlug(), this.resolvedYear()));
  // Class has *some* scraped standings across any year — used to distinguish
  // "we just don't have this year" from "this class doesn't publish a
  // season-long championship" (guide-only classes like BTR).
  readonly everScraped = computed(() => getClassStandings(this.classSlug()) !== null);
  readonly guide = computed(() => getClassGuide(this.classSlug()));
  readonly grid = computed(() => getClassGrid(this.classSlug(), this.resolvedYear()));
  readonly notes = computed(() => CLASS_NOTES[this.classSlug()] ?? null);
  readonly displayName = computed(
    () => this.cls()?.class_name ?? this.guide()?.display_name ?? 'Class',
  );
  readonly notFound = computed(() => !this.cls() && !this.guide() && !this.everScraped());

  // PDFs for this class across all rounds of the selected year. We surface
  // the full set so standings readers can jump to any round's analysis or
  // entry list without leaving the page.
  readonly classPdfs = computed(() => {
    const year = this.resolvedYear();
    const slug = this.classSlug();
    const all = getEventPdfs();
    return all.events
      .filter((g) => g.season_year === year)
      .flatMap((g) => g.pdfs.filter((p) => p.class_slug === slug));
  });

  readonly hasScrapedStandings = computed(() => this.cls() !== null);

  readonly classOptions = computed<FilterClassOption[]>(() => {
    const slugs = getKnownClassSlugs();
    return slugs.map((slug) => ({
      slug,
      label: getClassGuide(slug)?.display_name ?? slug,
    }));
  });

  constructor() {
    effect(() => {
      const cls = this.cls();
      const guide = this.guide();
      const year = this.resolvedYear();
      if (!cls && !guide) {
        this.seo.setMeta({
          title: 'Class not found',
          canonical: `/standings/${year}/${this.classSlug()}`,
        });
        return;
      }
      const name = cls?.class_name ?? guide?.display_name ?? 'Class';
      this.seo.setMeta({
        title: `${year} ${name} Standings`,
        description: cls
          ? `${year} MotoAmerica ${name} championship standings.`
          : `${year} MotoAmerica ${name} — archived results and PDF downloads.`,
        canonical: `/standings/${year}/${this.classSlug()}`,
      });
    });
  }
}
