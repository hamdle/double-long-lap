import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { getSchedule, type ScheduleEvent } from '../../data/data';
import {
  daysUntil,
  formatDateRange,
  stateOf,
  type EventState,
} from '../../data/event-dates';
import { SeoService } from '../../seo/seo.service';

type RowEvent = ScheduleEvent & {
  state: EventState;
  dateRange: string;
  daysToGo: number;
};

@Component({
  selector: 'dll-schedule-index',
  imports: [RouterLink, Card, Button, Tag, TableModule],
  templateUrl: './schedule-index.html',
  styleUrl: './schedule-index.scss',
})
export class ScheduleIndex implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly today = new Date();

  private readonly data = getSchedule();
  readonly seasonYear = this.data.season_year;

  readonly events: RowEvent[] = this.data.events.map((e) => ({
    ...e,
    state: stateOf(e, this.today),
    dateRange: formatDateRange(e.start_date, e.end_date),
    daysToGo: daysUntil(e.start_date, this.today),
  }));

  readonly nextUp: RowEvent | null =
    this.events.find((e) => e.state === 'live' || e.state === 'upcoming') ?? null;

  ngOnInit(): void {
    this.seo.setMeta({
      title: 'Schedule',
      description: `The ${this.seasonYear} MotoAmerica calendar with countdown to the next round.`,
      canonical: '/schedule',
    });
  }

  daysLabel(n: number): string {
    return n === 1 ? '1 day to go' : `${n} days to go`;
  }
}
