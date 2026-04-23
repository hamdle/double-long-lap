import type { ScheduleEvent } from './data-types';

export type EventState = 'past' | 'live' | 'upcoming';

export function stateOf(event: ScheduleEvent, today: Date): EventState {
  const start = new Date(`${event.start_date}T00:00:00`);
  const end = new Date(`${event.end_date}T23:59:59`);
  if (end < today) return 'past';
  if (start <= today && today <= end) return 'live';
  return 'upcoming';
}

export function daysUntil(dateStr: string, today: Date): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const ms = target.getTime() - today.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const month = s.toLocaleString('en-US', { month: 'short' });
  const year = s.getFullYear();
  if (sameMonth) return `${month} ${s.getDate()}–${e.getDate()}, ${year}`;
  const endMonth = e.toLocaleString('en-US', { month: 'short' });
  return `${month} ${s.getDate()} – ${endMonth} ${e.getDate()}, ${year}`;
}

export function formatScrapedAt(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
