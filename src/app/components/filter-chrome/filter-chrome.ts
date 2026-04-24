import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Select } from 'primeng/select';
import { getEventPdfRounds, getEventPdfYears } from '../../data/data';

// The filter chrome is the MotoGP-style navigation band that sits above the
// hero on the Results and Standings pages: a tab strip linking Results <->
// Standings <-> Records, plus a row of dropdowns scoped to the current mode.
//
// The URL is the source of truth — the page reads route params, passes them
// in, and the chrome navigates to a new URL on any dropdown change. Phase 1
// ships Year + Class (standings mode) and Year + Event (results mode); Type,
// Class, Session, and the standings View selector arrive in later phases as
// the underlying data lands.

type TabKey = 'results' | 'standings' | 'records';

export type FilterClassOption = {
  slug: string;
  label: string;
};

type YearOption = { value: number; label: string };
type EventOption = { slug: string; label: string };

@Component({
  selector: 'dll-filter-chrome',
  imports: [FormsModule, RouterLink, RouterLinkActive, Select],
  templateUrl: './filter-chrome.html',
  styleUrl: './filter-chrome.scss',
})
export class FilterChrome {
  private readonly router = inject(Router);

  readonly mode = input.required<'results' | 'standings'>();
  readonly year = input.required<number>();
  readonly classSlug = input<string | null>(null);
  readonly eventSlug = input<string | null>(null);
  // Extra class options the parent wants surfaced (e.g. standings includes
  // every known class, even those without scraped standings). Each is a
  // {slug, label} pair. If omitted, we derive a sensible default from the
  // PDF manifest, but standings mode should always supply this explicitly.
  readonly classOptions = input<FilterClassOption[]>([]);

  readonly yearOptions = computed<YearOption[]>(() => {
    // Union of years we have any data for (PDF manifest) and the current
    // selected year so the dropdown always shows what the URL asserts.
    const years = new Set<number>(getEventPdfYears());
    years.add(this.year());
    return Array.from(years)
      .sort((a, b) => b - a)
      .map((y) => ({ value: y, label: String(y) }));
  });

  readonly eventOptions = computed<EventOption[]>(() => {
    return getEventPdfRounds(this.year()).map((g) => ({
      slug: g.event_slug,
      label: g.title,
    }));
  });

  readonly tabs: Array<{ key: TabKey; label: string; link: string | null; disabled: boolean }> = [
    { key: 'results', label: 'Results', link: '/results', disabled: false },
    { key: 'standings', label: 'Standings', link: '/standings', disabled: false },
    // Records stays in the strip so the chrome reads correctly against the
    // MotoGP shape, but it's gated until Phase 3 when the circuit-records
    // widget ships — no route target, no click target.
    { key: 'records', label: 'Records', link: null, disabled: true },
  ];

  readonly activeTab = computed<TabKey>(() => (this.mode() === 'results' ? 'results' : 'standings'));

  onYearChange(next: number): void {
    if (next === this.year()) return;
    if (this.mode() === 'standings') {
      const slug = this.classSlug() ?? '';
      if (!slug) {
        this.router.navigate(['/standings']);
        return;
      }
      this.router.navigate(['/standings', next, slug]);
    } else {
      // Results mode: changing year clears the event since event slugs are
      // year-scoped. Drop the user on the /results landing for the new year.
      this.router.navigate(['/results']);
    }
  }

  onClassChange(next: string): void {
    if (!next || next === this.classSlug()) return;
    this.router.navigate(['/standings', this.year(), next]);
  }

  onEventChange(next: string): void {
    if (!next || next === this.eventSlug()) return;
    this.router.navigate(['/results', this.year(), next]);
  }
}
