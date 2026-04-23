import { Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { ClassGuide } from '../../components/class-guide/class-guide';
import { ClassGridTable } from '../../components/class-grid-table/class-grid-table';
import { ClassNotes } from '../../components/class-notes/class-notes';
import { CLASS_NOTES } from '../../data/class-notes';
import {
  getClassGrid,
  getClassGuide,
  getClassStandings,
} from '../../data/data';
import { SeoService } from '../../seo/seo.service';

@Component({
  selector: 'dll-standings-class',
  imports: [RouterLink, Button, ClassGuide, ClassGridTable, ClassNotes],
  templateUrl: './standings-class.html',
  styleUrl: './standings-class.scss',
})
export class StandingsClass {
  private readonly seo = inject(SeoService);

  readonly classSlug = input.required<string>();

  readonly cls = computed(() => getClassStandings(this.classSlug()));
  readonly guide = computed(() => getClassGuide(this.classSlug()));
  readonly grid = computed(() => getClassGrid(this.classSlug()));
  readonly notes = computed(() => CLASS_NOTES[this.classSlug()] ?? null);
  readonly displayName = computed(
    () => this.cls()?.class_name ?? this.guide()?.display_name ?? 'Class',
  );
  readonly notFound = computed(() => !this.cls() && !this.guide());

  constructor() {
    effect(() => {
      const cls = this.cls();
      const guide = this.guide();
      if (!cls && !guide) {
        this.seo.setMeta({
          title: 'Class not found',
          canonical: `/standings/${this.classSlug()}`,
        });
        return;
      }
      const name = cls?.class_name ?? guide?.display_name ?? 'Class';
      const year = cls?.season_year;
      this.seo.setMeta({
        title: `${name} Standings`,
        description: year
          ? `${year} MotoAmerica ${name} championship standings.`
          : `MotoAmerica ${name} class guide.`,
        canonical: `/standings/${this.classSlug()}`,
      });
    });
  }
}
