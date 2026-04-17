import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliateBlock } from "@/components/AffiliateBlock";
import { getSchedule, getVenue } from "@/lib/data";
import { hasTravelGuide } from "@/lib/travel-guides";

export async function generateStaticParams() {
  const data = await getSchedule();
  return data.events.map((e) => ({ slug: e.event_slug }));
}

export async function generateMetadata(props: PageProps<"/venues/[slug]">) {
  const { slug } = await props.params;
  const v = await getVenue(slug);
  if (!v) return { title: "Venue not found" };
  return {
    title: `${v.location}`,
    description: `MotoAmerica venue info for ${v.location}.`,
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

export default async function VenueDetailPage(props: PageProps<"/venues/[slug]">) {
  const { slug } = await props.params;
  const venue = await getVenue(slug);
  if (!venue) notFound();
  const showTravelGuide = hasTravelGuide(venue.event_slug);

  return (
    <>
      <section className="p-strip">
        <div className="row">
          <div className="col-8">
            <p>
              <Link href="/venues">← All venues</Link>
            </p>
            <h1 className="p-heading--1">{venue.location}</h1>
            <p className="p-heading--4 u-text-muted">
              {venue.title} · {formatDateRange(venue.start_date, venue.end_date)}
            </p>
            <p>
              <a
                href={venue.details_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-button--positive"
              >
                Official event page ↗
              </a>
              {showTravelGuide ? (
                <>
                  {" "}
                  <Link
                    href={`/venues/${venue.event_slug}/travel`}
                    className="p-button"
                  >
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
          <div className="col-8">
            <h2 className="p-heading--3">Track info</h2>
            <p className="u-text-muted">
              Layout, length, corner count, and elevation details are coming soon.
            </p>

            <h2 className="p-heading--3">Race weekend</h2>
            <p>
              Rounds are held {formatDateRange(venue.start_date, venue.end_date)}.
            </p>
          </div>

          <div className="col-4">
            <AffiliateBlock
              title="Track days at this venue"
              blurb="Ride the same circuit the pros ride. Find upcoming track days via our partners."
            />
          </div>
        </div>
      </section>
    </>
  );
}
