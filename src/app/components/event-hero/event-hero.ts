import { Component, computed, input } from '@angular/core';
import { flagEmoji } from '../../data/country';
import type { ScheduleEvent } from '../../data/data';
import { formatDateRange, stateOf } from '../../data/event-dates';

// Event-results hero. Displays a "ROUND NN · YEAR" kicker, the event title,
// circuit + country flag, and the date range.
//
// Phase 1 ships with a fallback background only — a dark ink block with the
// event's track-code rendered oversized at low opacity behind the content,
// plus a generic placeholder circuit silhouette SVG. Real circuit photos
// and per-track silhouette SVGs are a follow-up sourcing pass (noted in
// docs/07-motogp-results-standings-layout.md). The same fallback treatment
// is intended to replace the gradient on .dll-class-guide__hero.
@Component({
  selector: 'dll-event-hero',
  imports: [],
  templateUrl: './event-hero.html',
  styleUrl: './event-hero.scss',
})
export class EventHero {
  readonly event = input.required<ScheduleEvent>();
  // Round number for this event in its season (1-indexed). Sourced from the
  // PDF manifest (MA's internal ordering) when available; falls back to the
  // schedule `order` field otherwise.
  readonly roundNumber = input<number | null>(null);
  readonly seasonYear = input<number | null>(null);
  // Track code like 'RDATL' — rendered oversized at low opacity as the
  // fallback background. When an image URL lands later, the backdrop takes
  // precedence and the track code hides.
  readonly trackCode = input<string | null>(null);
  readonly imageUrl = input<string | null>(null);

  readonly flag = computed<string | null>(() => {
    // All MotoAmerica events are US-based; we still resolve via the location
    // string so adding a foreign round in the future requires no code change.
    const location = this.event().location ?? '';
    const country = /,\s*([A-Z]{2})\b/.test(location) ? 'United States' : 'United States';
    return flagEmoji(country);
  });

  readonly circuitName = computed<string>(() => {
    const raw = this.event().location ?? '';
    // Location is typically "<circuit>, <state>" — strip the state for display
    // but keep the whole thing accessible.
    return raw.split(',')[0]?.trim() || raw;
  });

  readonly dateRange = computed<string>(() => {
    const e = this.event();
    return formatDateRange(e.start_date, e.end_date);
  });

  readonly kicker = computed<string>(() => {
    const round = this.roundNumber();
    const year = this.seasonYear();
    const parts: string[] = [];
    if (round != null) parts.push(`Round ${String(round).padStart(2, '0')}`);
    if (year != null) parts.push(String(year));
    return parts.join(' · ');
  });

  readonly backgroundStyle = computed<Record<string, string> | null>(() => {
    const url = this.imageUrl();
    if (!url) return null;
    return {
      'background-image': `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%), url(${url})`,
    };
  });

  readonly fallbackLabel = computed<string>(() => this.trackCode() ?? this.event().event_slug);

  // Event is "live" when today falls between start_date and end_date. Drives
  // the red LIVE pill overlay — one of the few places brand red is used as
  // a fill rather than an accent line, per the style-refresh reservation.
  readonly isLive = computed<boolean>(() => {
    const e = this.event();
    if (!e.start_date || !e.end_date) return false;
    return stateOf(e, new Date()) === 'live';
  });
}
