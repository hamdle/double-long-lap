import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Select } from 'primeng/select';
import {
  getClassSlugsWithSessions,
  getEventPdfRounds,
  getEventPdfYears,
} from '../../data/data';

// The filter chrome is the MotoGP-style navigation band that sits above the
// hero on the Results and Standings pages: a tab strip linking Results <->
// Standings <-> Records, plus a row of dropdowns scoped to the current mode.
//
// URL is the source of truth — the page reads route params, passes them in,
// and the chrome navigates to a new URL on any dropdown change. Three modes:
//   - standings:        Year + Class
//   - results:          Year + Event
//   - results-session:  Year + Event + Class + Session (the MotoGP-shaped row)

type TabKey = 'results' | 'standings' | 'records';
type Mode = 'results' | 'standings' | 'results-session';

export type FilterClassOption = {
  slug: string;
  label: string;
};

export type FilterSessionOption = {
  code: string;
  label: string;
  url: string;
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

  readonly mode = input.required<Mode>();
  readonly year = input.required<number>();
  readonly classSlug = input<string | null>(null);
  readonly eventSlug = input<string | null>(null);
  // URL-segment form of the session code (e.g. 'r1'), not the MA code ('R1').
  // The page passes it through verbatim; this component only reads/writes URL
  // segments, never MA codes.
  readonly session = input<string | null>(null);
  readonly classOptions = input<FilterClassOption[]>([]);
  readonly sessionOptions = input<FilterSessionOption[]>([]);

  readonly yearOptions = computed<YearOption[]>(() => {
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

  // In results-session mode we still want a populated Class dropdown when the
  // page hasn't provided one explicitly; derive from the parsed-sessions index.
  readonly resolvedClassOptions = computed<FilterClassOption[]>(() => {
    const explicit = this.classOptions();
    if (explicit.length > 0) return explicit;
    if (this.mode() !== 'results-session' || !this.eventSlug()) return [];
    return getClassSlugsWithSessions(this.year(), this.eventSlug()!).map((slug) => ({
      slug,
      label: slug,
    }));
  });

  readonly tabs: Array<{ key: TabKey; label: string; link: string | null; disabled: boolean }> = [
    { key: 'results', label: 'Results', link: '/results', disabled: false },
    { key: 'standings', label: 'Standings', link: '/standings/2026/superbike', disabled: false },
    { key: 'records', label: 'Records', link: null, disabled: true },
  ];

  readonly activeTab = computed<TabKey>(() =>
    this.mode() === 'standings' ? 'standings' : 'results',
  );

  // Visibility flags used by the template to render only the dropdowns that
  // make sense for the current mode.
  readonly showClass = computed(
    () => this.mode() === 'standings' || this.mode() === 'results-session',
  );
  readonly showEvent = computed(
    () => this.mode() === 'results' || this.mode() === 'results-session',
  );
  readonly showSession = computed(() => this.mode() === 'results-session');

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
      // Results mode: event/class/session slugs are year-scoped, so drop the
      // user on the /results landing for the new year rather than guessing.
      this.router.navigate(['/results']);
    }
  }

  onClassChange(next: string): void {
    if (!next || next === this.classSlug()) return;
    if (this.mode() === 'standings') {
      this.router.navigate(['/standings', this.year(), next]);
      return;
    }
    if (this.mode() === 'results-session' && this.eventSlug()) {
      // Landing on the class redirects to its best default session at the
      // same event, so we don't need to carry the current session forward.
      this.router.navigate(['/results', this.year(), this.eventSlug(), next]);
    }
  }

  onEventChange(next: string): void {
    if (!next || next === this.eventSlug()) return;
    if (this.mode() === 'results-session' && this.classSlug()) {
      this.router.navigate(['/results', this.year(), next, this.classSlug()]);
      return;
    }
    this.router.navigate(['/results', this.year(), next]);
  }

  onSessionChange(next: string): void {
    if (!next || next === this.session()) return;
    if (!this.eventSlug() || !this.classSlug()) return;
    this.router.navigate([
      '/results',
      this.year(),
      this.eventSlug(),
      this.classSlug(),
      next,
    ]);
  }
}
