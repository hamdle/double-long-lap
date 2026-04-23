import { Component, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import type { SortEvent } from 'primeng/api';
import type { ClassGridRider } from '../../data/data';
import { flagEmoji } from '../../data/country';

type SortField =
  | 'position'
  | 'number'
  | 'name'
  | 'bike_manufacturer'
  | 'nationality'
  | 'points'
  | 'gap_to_leader';

@Component({
  selector: 'dll-class-grid-table',
  imports: [TableModule],
  templateUrl: './class-grid-table.html',
  styleUrl: './class-grid-table.scss',
})
export class ClassGridTable {
  readonly riders = input.required<ClassGridRider[]>();
  readonly className = input.required<string>();

  flag(nationality: string | null): string | null {
    return flagEmoji(nationality);
  }

  // Custom sort that keeps unranked riders (null in the sort field) at the
  // end regardless of direction, with name as the secondary key. Mirrors the
  // legacy ClassGridTable semantics so users always see the meaningful rows
  // first whether they sorted ascending or descending.
  customSort(event: SortEvent): void {
    const { data, field, order } = event;
    if (!data || !field || !order) return;
    const key = field as SortField;
    const dir = order;
    data.sort((a: ClassGridRider, b: ClassGridRider) => compare(a, b, key, dir));
  }
}

function compare(
  a: ClassGridRider,
  b: ClassGridRider,
  key: SortField,
  dir: number,
): number {
  const nullsLast = (hasA: boolean, hasB: boolean): number | null => {
    if (hasA && !hasB) return -1;
    if (!hasA && hasB) return 1;
    if (!hasA && !hasB) return a.name.localeCompare(b.name);
    return null;
  };

  switch (key) {
    case 'position': {
      const tie = nullsLast(a.position != null, b.position != null);
      if (tie != null) return tie;
      return (a.position! - b.position!) * dir;
    }
    case 'number': {
      const tie = nullsLast(a.number != null, b.number != null);
      if (tie != null) return tie;
      return (a.number! - b.number!) * dir;
    }
    case 'points': {
      const tie = nullsLast(a.points != null, b.points != null);
      if (tie != null) return tie;
      return (a.points! - b.points!) * dir;
    }
    case 'gap_to_leader': {
      const tie = nullsLast(a.gap_to_leader != null, b.gap_to_leader != null);
      if (tie != null) return tie;
      return (a.gap_to_leader! - b.gap_to_leader!) * dir;
    }
    case 'name':
      return a.name.localeCompare(b.name) * dir;
    case 'bike_manufacturer': {
      const am = a.bike_manufacturer ?? '';
      const bm = b.bike_manufacturer ?? '';
      const tie = nullsLast(!!am, !!bm);
      if (tie != null) return tie;
      return (am.localeCompare(bm) || a.name.localeCompare(b.name)) * dir;
    }
    case 'nationality': {
      const an = a.nationality ?? '';
      const bn = b.nationality ?? '';
      const tie = nullsLast(!!an, !!bn);
      if (tie != null) return tie;
      return (an.localeCompare(bn) || a.name.localeCompare(b.name)) * dir;
    }
  }
}
