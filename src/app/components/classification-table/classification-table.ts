import { Component, computed, input } from '@angular/core';
import type { SessionResult, SessionResultRow } from '../../data/data';
import { getSessionResult } from '../../data/data';
import { manufacturerColor } from '../../data/manufacturer';

// Per-session classification table. Groups finishers above a "Not Classified"
// header row for DNF/DSQ/DNS entries. Races show Diff / Total Tm / Best Tm /
// Points; qualifying and practice swap to Best Tm / In Lap / Diff.
//
// Position stripe colours ride on the first <td> via box-shadow:inset, one
// variant per theme — manufacturer.ts exports the light/dark pair. MotoGP
// awards 25/20/16/13/11/10/9/8/7/6/5/4/3/2/1 for P1 through P15; we ship the
// same table for races, and leave Pts blank for qualifying/practice sessions.

type DisplayKind = 'race' | 'qual-practice';

type DisplayRow = SessionResultRow & {
  stripeLight: string;
  stripeDark: string;
  points: number | null;
  positionLabel: string;
  gapLabel: string;
  bestLapLabel: string;
  totalTimeLabel: string;
  // Race 2 only: change in position vs Race 1 for the same rider. Positive =
  // climbed (▲), negative = dropped (▼). Null when there's no R1 record or
  // not on R2.
  positionDelta: number | null;
};

const POINTS_TABLE = [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
// Race session codes that award championship points.
const POINTS_SESSIONS = new Set(['R1', 'R2']);

function formatMs(ms: number | null): string {
  if (ms == null) return '';
  const totalMs = Math.max(0, Math.round(ms));
  const minutes = Math.floor(totalMs / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1000);
  const fractional = String(totalMs % 1000).padStart(3, '0');
  return minutes > 0
    ? `${minutes}:${String(seconds).padStart(2, '0')}.${fractional}`
    : `${seconds}.${fractional}`;
}

// For the Diff column: leader is blank, gaps use "+" prefix, laps use "1 Lap".
function formatGap(row: SessionResultRow, isLeader: boolean): string {
  if (row.status === 'dnf') return 'DNF';
  if (row.status === 'dsq') return 'DSQ';
  if (row.status === 'dns') return 'DNS';
  if (row.laps_down != null) {
    return row.laps_down === 1 ? '1 Lap' : `${row.laps_down} Laps`;
  }
  if (isLeader) return '';
  if (row.gap_to_leader_ms == null) return '';
  return `+${formatMs(row.gap_to_leader_ms)}`;
}

@Component({
  selector: 'dll-classification-table',
  imports: [],
  templateUrl: './classification-table.html',
  styleUrl: './classification-table.scss',
})
export class ClassificationTable {
  readonly session = input.required<SessionResult>();

  readonly kind = computed<DisplayKind>(() =>
    POINTS_SESSIONS.has(this.session().session_code) ||
    this.session().session_code === 'WU'
      ? 'race'
      : 'qual-practice',
  );
  // Warm-up is run-order + times; we show it with the race column set for
  // continuity with R1/R2 but award no points.
  readonly awardsPoints = computed(() => POINTS_SESSIONS.has(this.session().session_code));

  // For Race 2, look up Race 1 positions by bike number. When present, we
  // render a ▲N / ▼N delta next to each classified rider's position.
  private readonly priorRacePositions = computed<Map<number, number>>(() => {
    const s = this.session();
    if (s.session_code !== 'R2') return new Map();
    const r1 = getSessionResult(s.season_year, s.event_slug, s.class_slug, 'R1');
    if (!r1) return new Map();
    const map = new Map<number, number>();
    for (const row of r1.rows) {
      if (row.rider_number != null && row.position != null) {
        map.set(row.rider_number, row.position);
      }
    }
    return map;
  });

  readonly classifiedRows = computed<DisplayRow[]>(() =>
    this.session()
      .rows.filter((r) => r.status === 'classified' || r.status === 'lapped')
      .map((r, i) => this.enrich(r, i === 0)),
  );

  readonly unclassifiedRows = computed<DisplayRow[]>(() =>
    this.session()
      .rows.filter((r) => r.status !== 'classified' && r.status !== 'lapped')
      .map((r) => this.enrich(r, false)),
  );

  private enrich(row: SessionResultRow, isLeader: boolean): DisplayRow {
    const stripeLight = manufacturerColor(row.bike_make, 'light');
    const stripeDark = manufacturerColor(row.bike_make, 'dark');
    const awards = POINTS_SESSIONS.has(this.session().session_code);
    const pts =
      awards && row.position != null && row.position >= 1 && row.position <= POINTS_TABLE.length
        ? POINTS_TABLE[row.position - 1]
        : null;
    const positionLabel =
      row.position != null
        ? String(row.position)
        : row.status === 'dnf'
          ? 'DNF'
          : row.status === 'dsq'
            ? 'DSQ'
            : row.status === 'dns'
              ? 'DNS'
              : '';
    const prior = row.rider_number != null ? this.priorRacePositions().get(row.rider_number) : undefined;
    const positionDelta =
      prior != null && row.position != null ? prior - row.position : null;
    return {
      ...row,
      stripeLight,
      stripeDark,
      points: pts,
      positionLabel,
      gapLabel: formatGap(row, isLeader),
      bestLapLabel: formatMs(row.best_lap_ms),
      totalTimeLabel: formatMs(row.total_time_ms),
      positionDelta,
    };
  }

  // CSS custom-property bag for per-row stripe colors. Angular binds this
  // onto the row's style attribute; the component's scss selects the right
  // variant based on html.is-dark.
  stripeStyle(row: DisplayRow): Record<string, string> {
    return {
      '--dll-stripe-light': row.stripeLight,
      '--dll-stripe-dark': row.stripeDark,
    };
  }
}
