import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectButton } from 'primeng/selectbutton';
import type { EventPdf } from '../../data/data';

// Segmented switcher + row list for the per-event / per-class PDF block. Given
// an `EventPdf[]` (already filtered by the caller), group by session and let
// the user flip between groups. When only one group is present we hide the
// switcher and just show the list.

type SessionGroup = {
  key: string;              // stable — session_code or an event-wide sentinel
  label: string;            // user-facing
  sort: number;             // rank within the switcher
  pdfs: EventPdf[];
};

// Session-code → (label, sortRank). Sessions without an entry land at the end
// with an alphabetical fallback.
const SESSION_RANK: Record<string, { label: string; sort: number }> = {
  P1: { label: 'Free Practice 1', sort: 10 },
  P2: { label: 'Free Practice 2', sort: 11 },
  TP: { label: 'Timed Practice', sort: 12 },
  Q1: { label: 'Qualifying', sort: 20 },
  QP: { label: 'Qualifying', sort: 20 },
  WUP: { label: 'Warm Up', sort: 30 },
  R1: { label: 'Race 1', sort: 40 },
  R2: { label: 'Race 2', sort: 41 },
};

const CHAMPIONSHIP_KEY = 'championship';

@Component({
  selector: 'dll-pdf-downloads',
  imports: [FormsModule, SelectButton],
  templateUrl: './pdf-downloads.html',
  styleUrl: './pdf-downloads.scss',
})
export class PdfDownloads {
  readonly pdfs = input.required<EventPdf[]>();
  // Heading text shown above the switcher. Optional — the caller decides
  // whether to frame the block with a heading or not.
  readonly heading = input<string | null>(null);
  readonly emptyMessage = input<string>('No PDFs available yet for this selection.');

  readonly groups = computed<SessionGroup[]>(() => {
    const byKey = new Map<string, SessionGroup>();
    for (const pdf of this.pdfs()) {
      const key = pdf.session_code ?? CHAMPIONSHIP_KEY;
      const existing = byKey.get(key);
      if (existing) {
        existing.pdfs.push(pdf);
      } else {
        const rank = pdf.session_code ? SESSION_RANK[pdf.session_code] : null;
        byKey.set(key, {
          key,
          label: rank?.label ?? pdf.session_label ?? (pdf.session_code ?? 'Championship'),
          sort: rank?.sort ?? (pdf.session_code ? 90 : 100),
          pdfs: [pdf],
        });
      }
    }
    return Array.from(byKey.values()).sort((a, b) => {
      if (a.sort !== b.sort) return a.sort - b.sort;
      return a.label.localeCompare(b.label);
    });
  });

  // The currently-active switcher group. Defaults to the first group; clears
  // when the input list changes in a way that invalidates the selection.
  private readonly selectedKey = signal<string | null>(null);

  readonly activeGroupKey = computed<string | null>(() => {
    const groups = this.groups();
    if (groups.length === 0) return null;
    const current = this.selectedKey();
    if (current && groups.some((g) => g.key === current)) return current;
    return groups[0].key;
  });

  readonly activeGroup = computed<SessionGroup | null>(() => {
    const key = this.activeGroupKey();
    return this.groups().find((g) => g.key === key) ?? null;
  });

  readonly switcherVisible = computed(() => this.groups().length > 1);

  readonly switcherOptions = computed(() =>
    this.groups().map((g) => ({ label: g.label, value: g.key })),
  );

  setActiveGroup(key: string): void {
    this.selectedKey.set(key);
  }
}
