import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClassificationTable } from '../../components/classification-table/classification-table';
import { EventHero } from '../../components/event-hero/event-hero';
import { FilterChrome, type FilterClassOption } from '../../components/filter-chrome/filter-chrome';
import { PdfDownloads } from '../../components/pdf-downloads/pdf-downloads';
import {
  getClassGuide,
  getCurrentSeasonYear,
  getEventPdfGroup,
  getSchedule,
  getSessionResult,
  getSessionResultsForClass,
} from '../../data/data';
import { SeoService } from '../../seo/seo.service';

// MA session code → URL segment, bidirectional. URL segments are lowercase
// MotoGP-ish short forms ("r1", "q1", "p1"); internal codes come back as the
// upper-case versions MA uses in PDF filenames. Centralised here because both
// the page (reading the URL) and filter-chrome (writing it) need to agree.
const SESSION_URL_TO_CODE: Record<string, string> = {
  p1: 'P1',
  p2: 'P2',
  tp: 'TP',
  q1: 'Q1',
  wu: 'WU',
  r1: 'R1',
  r2: 'R2',
};

const SESSION_CODE_TO_URL: Record<string, string> = Object.fromEntries(
  Object.entries(SESSION_URL_TO_CODE).map(([url, code]) => [code, url]),
);

export function sessionUrlSegment(sessionCode: string): string {
  return SESSION_CODE_TO_URL[sessionCode] ?? sessionCode.toLowerCase();
}

export function sessionCodeFromUrl(segment: string): string {
  return SESSION_URL_TO_CODE[segment.toLowerCase()] ?? segment.toUpperCase();
}

@Component({
  selector: 'dll-results-session',
  imports: [RouterLink, ClassificationTable, EventHero, FilterChrome, PdfDownloads],
  templateUrl: './results-session.html',
  styleUrl: './results-session.scss',
})
export class ResultsSession {
  private readonly seo = inject(SeoService);
  private readonly doc = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  // Briefly flips to 'copied' after the user clicks Copy link; the template
  // swaps the button label accordingly. No-op during SSR.
  readonly copyState = signal<'idle' | 'copied'>('idle');

  readonly year = input.required<string>();
  readonly eventSlug = input.required<string>();
  readonly classSlug = input.required<string>();
  readonly session = input.required<string>();

  readonly resolvedYear = computed<number>(() => {
    const n = Number(this.year());
    return Number.isFinite(n) ? n : getCurrentSeasonYear();
  });

  readonly sessionCode = computed(() => sessionCodeFromUrl(this.session()));

  readonly sessionResult = computed(() =>
    getSessionResult(
      this.resolvedYear(),
      this.eventSlug(),
      this.classSlug(),
      this.sessionCode(),
    ),
  );

  readonly pdfGroup = computed(() =>
    getEventPdfGroup(this.resolvedYear(), this.eventSlug()),
  );

  readonly scheduleEvent = computed(() => {
    const schedule = getSchedule();
    if (schedule.season_year !== this.resolvedYear()) return null;
    return schedule.events.find((e) => e.event_slug === this.eventSlug()) ?? null;
  });

  // Event object for the hero — prefer the schedule entry (real dates), fall
  // back to a synthetic one derived from the PDF group's title.
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

  readonly className = computed(
    () => getClassGuide(this.classSlug())?.display_name ?? this.classSlug(),
  );

  readonly trackCode = computed(() => this.pdfGroup()?.track_code ?? null);
  readonly roundNumber = computed(
    () => this.pdfGroup()?.round_number ?? this.scheduleEvent()?.order ?? null,
  );

  // PDFs scoped to this class at this event; used for the Phase 1-style block
  // at the bottom of the page. Keeps the page useful even when the specific
  // session's classification isn't parsed yet.
  readonly classPdfs = computed(() => {
    const group = this.pdfGroup();
    if (!group) return [];
    return group.pdfs.filter((p) => p.class_slug === this.classSlug());
  });

  readonly classOptions = computed<FilterClassOption[]>(() => {
    const group = this.pdfGroup();
    if (!group) return [];
    const slugs = new Set<string>();
    for (const p of group.pdfs) if (p.class_slug) slugs.add(p.class_slug);
    return Array.from(slugs).map((slug) => ({
      slug,
      label: getClassGuide(slug)?.display_name ?? slug,
    }));
  });

  readonly sessionOptions = computed<Array<{ code: string; label: string; url: string }>>(() => {
    const sessions = getSessionResultsForClass(
      this.resolvedYear(),
      this.eventSlug(),
      this.classSlug(),
    );
    return sessions.map((s) => ({
      code: s.session_code,
      label: s.session_label,
      url: sessionUrlSegment(s.session_code),
    }));
  });

  readonly notFound = computed(() => !this.displayEvent() || this.classOptions().length === 0);

  async copyDeepLink(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const win = this.doc.defaultView;
    if (!win?.navigator?.clipboard) return;
    try {
      await win.navigator.clipboard.writeText(win.location.href);
      this.copyState.set('copied');
      win.setTimeout(() => this.copyState.set('idle'), 1800);
    } catch {
      // Clipboard may be blocked; silently bail.
    }
  }

  constructor() {
    effect(() => {
      const year = this.resolvedYear();
      const event = this.displayEvent();
      const result = this.sessionResult();
      if (!event) {
        this.seo.setMeta({
          title: 'Session not found',
          canonical: `/results/${year}/${this.eventSlug()}/${this.classSlug()}/${this.session()}`,
        });
        return;
      }
      const sessionLabel = result?.session_label ?? this.sessionCode();
      const cls = this.className();
      this.seo.setMeta({
        title: `${event.title} — ${cls} ${sessionLabel}`,
        description: result
          ? `${cls} ${sessionLabel} classification for ${event.title}.`
          : `${cls} ${sessionLabel} results for ${event.title} — PDF archive.`,
        canonical: `/results/${year}/${this.eventSlug()}/${this.classSlug()}/${this.session()}`,
      });
    });
  }
}
