import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchedule, getStandings, getVenue } from "@/lib/data";
import { slugify } from "@/lib/slug";
import { hasTravelGuide } from "@/lib/travel-guides";

export async function generateStaticParams() {
  const data = await getSchedule();
  return data.events.map((e) => ({ eventSlug: e.event_slug }));
}

export async function generateMetadata(props: PageProps<"/schedule/[eventSlug]">) {
  const { eventSlug } = await props.params;
  const v = await getVenue(eventSlug);
  if (!v) return { title: "Round not found" };
  return {
    title: `${v.title} — Race Weekend Guide`,
    description: `Race weekend guide for ${v.title} at ${v.location}.`,
  };
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

export default async function RaceWeekendPage(props: PageProps<"/schedule/[eventSlug]">) {
  const { eventSlug } = await props.params;
  const event = await getVenue(eventSlug);
  if (!event) notFound();
  const standings = await getStandings();

  return (
    <>
      <section className="p-strip">
        <div className="row">
          <div className="col-8">
            <p>
              <Link href="/schedule">← Full schedule</Link>
            </p>
            <h1 className="p-heading--1">{event.title}</h1>
            <p className="p-heading--4 u-text-muted">
              Round {event.order} · {event.location} · {formatDateRange(event.start_date, event.end_date)}
            </p>
            <p>
              <a
                href={event.details_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-button--positive"
              >
                Official event page ↗
              </a>
              {" "}
              <Link href={`/venues/${event.event_slug}`} className="p-button">
                Venue info →
              </Link>
              {hasTravelGuide(event.event_slug) ? (
                <>
                  {" "}
                  <Link href={`/venues/${event.event_slug}/travel`} className="p-button">
                    Travel guide →
                  </Link>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </section>

      <section className="p-strip is-shallow">
        <div className="row">
          <div className="col-12">
            <h2 className="p-heading--3">Who to watch</h2>
            <p className="u-text-muted">
              <small>Top three in each class heading into this weekend.</small>
            </p>
          </div>
          {standings.classes.map((c) => (
            <div key={c.class_slug} className="col-4">
              <div className="p-card">
                <h3 className="p-card__title">
                  <Link href={`/standings/${c.class_slug}`}>{c.class_name}</Link>
                </h3>
                <ol>
                  {c.top_riders.slice(0, 3).map((r) => (
                    <li key={`${r.position}-${r.name}`}>
                      <Link href={`/riders/${slugify(r.name)}`}>{r.name}</Link> — {r.points} pts
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

