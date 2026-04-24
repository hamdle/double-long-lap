import { Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventHero } from '../../components/event-hero/event-hero';
import { FilterChrome } from '../../components/filter-chrome/filter-chrome';
import { PdfDownloads } from '../../components/pdf-downloads/pdf-downloads';
import {
  getClassGuide,
  getClassSlugsWithSessions,
  getCurrentSeasonYear,
  getEventPdfGroup,
  getSchedule,
  getSessionResultsForClass,
} from '../../data/data';
import { sessionUrlSegment } from '../results-session/results-session';
import { SeoService } from '../../seo/seo.service';

// Phase 1 results-event page: filter chrome + event hero + PDF block, with a
// banner flagging that structured per-session classification lands in a later
// phase. No classification table yet — the PDF list is the main payload.
@Component({
  selector: 'dll-results-event',
  imports: [RouterLink, EventHero, FilterChrome, PdfDownloads],
  templateUrl: './results-event.html',
  styleUrl: './results-event.scss',
})
export class ResultsEvent {
  private readonly seo = inject(SeoService);

  readonly year = input.required<string>();
  readonly eventSlug = input.required<string>();

  readonly resolvedYear = computed<number>(() => {
    const n = Number(this.year());
    return Number.isFinite(n) ? n : getCurrentSeasonYear();
  });

  // PDF group is the primary data source. The schedule event (if any) gives
  // us real dates and a richer title; we fall back to the PDF group's own
  // title + synthesized dates when the event is outside the current season
  // schedule (e.g. browsing a 2025 round while the site is on 2026).
  readonly pdfGroup = computed(() =>
    getEventPdfGroup(this.resolvedYear(), this.eventSlug()),
  );

  readonly scheduleEvent = computed(() => {
    const schedule = getSchedule();
    if (schedule.season_year !== this.resolvedYear()) return null;
    return schedule.events.find((e) => e.event_slug === this.eventSlug()) ?? null;
  });

  // Synthesize a ScheduleEvent from the PDF group when the real schedule
  // doesn't carry this round (e.g. historical years). The date placeholders
  // are deliberately empty — the hero's date strip hides when both are blank.
  readonly displayEvent = computed(() => {
    const schedule = this.scheduleEvent();
    if (schedule) return schedule;
    const group = this.pdfGroup();
    if (!group) return null;
    return {
      order: group.round_number,
      event_slug: group.event_slug,
      title: group.title,
      location: '',
      start_date: `${group.season_year}-01-01`,
      end_date: `${group.season_year}-01-01`,
      details_url: '',
    };
  });

  readonly notFound = computed(() => !this.displayEvent());

  readonly trackCode = computed(() => this.pdfGroup()?.track_code ?? null);
  readonly roundNumber = computed(
    () => this.pdfGroup()?.round_number ?? this.scheduleEvent()?.order ?? null,
  );

  readonly pdfs = computed(() => this.pdfGroup()?.pdfs ?? []);

  // Classes we've parsed structured classifications for at this event, with
  // a link to each session we have. Populates the "Classifications" block
  // the user uses to drill into per-session tables.
  readonly parsedClasses = computed<
    Array<{
      slug: string;
      label: string;
      sessions: Array<{ code: string; label: string; url: string }>;
    }>
  >(() => {
    const year = this.resolvedYear();
    const slug = this.eventSlug();
    const slugs = getClassSlugsWithSessions(year, slug);
    return slugs.map((classSlug) => {
      const sessions = getSessionResultsForClass(year, slug, classSlug).map((s) => ({
        code: s.session_code,
        label: s.session_label,
        url: sessionUrlSegment(s.session_code),
      }));
      return {
        slug: classSlug,
        label: getClassGuide(classSlug)?.display_name ?? classSlug,
        sessions,
      };
    });
  });

  constructor() {
    effect(() => {
      const event = this.displayEvent();
      const year = this.resolvedYear();
      if (!event) {
        this.seo.setMeta({
          title: 'Event not found',
          canonical: `/results/${year}/${this.eventSlug()}`,
        });
        return;
      }
      this.seo.setMeta({
        title: `${year} ${event.title} — Results`,
        description: `Official MotoAmerica PDFs and session downloads for ${event.title}.`,
        canonical: `/results/${year}/${this.eventSlug()}`,
      });
    });
  }
}
