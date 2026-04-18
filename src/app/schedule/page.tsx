import Link from "next/link";
import { getSchedule, type ScheduleEvent } from "@/lib/data";

export const metadata = {
  title: "Schedule",
  description: "The 2026 MotoAmerica calendar with countdown to the next round.",
};

type EventState = "past" | "live" | "upcoming";

function stateOf(event: ScheduleEvent, today: Date): EventState {
  const start = new Date(`${event.start_date}T00:00:00`);
  const end = new Date(`${event.end_date}T23:59:59`);
  if (end < today) return "past";
  if (start <= today && today <= end) return "live";
  return "upcoming";
}

function daysUntil(dateStr: string, today: Date): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const ms = target.getTime() - today.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const month = s.toLocaleString("en-US", { month: "short" });
  const year = s.getFullYear();
  if (sameMonth) return `${month} ${s.getDate()}–${e.getDate()}, ${year}`;
  const endMonth = e.toLocaleString("en-US", { month: "short" });
  return `${month} ${s.getDate()} – ${endMonth} ${e.getDate()}, ${year}`;
}

export default async function SchedulePage() {
  const data = await getSchedule();
  const today = new Date();
  const events = data.events.map((e) => ({ ...e, state: stateOf(e, today) }));
  const nextUp = events.find((e) => e.state === "live" || e.state === "upcoming");

  return (
    <>
      <section className="p-strip">
        <div className="row">
          <div className="col-8">
            <h1 className="p-heading--1">{data.season_year} Schedule</h1>
            <p className="p-heading--4 u-text-muted">
              Ten rounds of MotoAmerica racing.
            </p>
          </div>
        </div>
      </section>

      {nextUp ? (
        <section className="p-strip is-shallow">
          <div className="row">
            <div className="col-12">
              <div className="p-card--highlighted">
                <h3 className="p-card__title">
                  {nextUp.state === "live" ? "Racing now" : "Next up"}: {nextUp.title}
                </h3>
                <p>
                  <strong>{nextUp.location}</strong>
                  <br />
                  {formatDateRange(nextUp.start_date, nextUp.end_date)}
                </p>
                {nextUp.state === "upcoming" ? (
                  <p className="p-heading--3">
                    {daysUntil(nextUp.start_date, today)} day
                    {daysUntil(nextUp.start_date, today) === 1 ? "" : "s"} to go
                  </p>
                ) : (
                  <p className="p-heading--3">Happening this weekend</p>
                )}
                <p>
                  <Link href={`/schedule/${nextUp.event_slug}`} className="p-button--positive">
                    Weekend guide →
                  </Link>
                  {" "}
                  <a href={nextUp.details_url} target="_blank" rel="noopener noreferrer">
                    Official details ↗
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="p-strip is-shallow">
        <div className="row">
          <div className="col-12">
            <table aria-label="2026 MotoAmerica calendar">
              <thead>
                <tr>
                  <th style={{ width: "4rem" }}>Rd</th>
                  <th>Event</th>
                  <th>Venue</th>
                  <th>Dates</th>
                  <th style={{ width: "8rem" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.event_slug}>
                    <td>{e.order}</td>
                    <td>
                      <Link href={`/schedule/${e.event_slug}`}>{e.title}</Link>
                    </td>
                    <td>{e.location}</td>
                    <td>{formatDateRange(e.start_date, e.end_date)}</td>
                    <td>
                      {e.state === "past" ? (
                        <span className="p-chip">
                          <span className="p-chip__value">Done</span>
                        </span>
                      ) : e.state === "live" ? (
                        <span className="p-chip is-dense">
                          <span className="p-chip__value">Live</span>
                        </span>
                      ) : (
                        <small className="u-text-muted">
                          in {daysUntil(e.start_date, today)}d
                        </small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
