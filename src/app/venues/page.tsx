import Link from "next/link";
import { getSchedule } from "@/lib/data";
import { hasTravelGuide } from "@/lib/travel-guides";

export const metadata = {
  title: "Venues",
  description: "MotoAmerica track info, travel guides, and track day availability.",
};

export default async function VenuesPage() {
  const data = await getSchedule();
  const venues = Array.from(new Map(data.events.map((e) => [e.location, e])).values());

  return (
    <>
      <section className="p-strip">
        <div className="row">
          <div className="col-8">
            <h1 className="p-heading--1">Venues</h1>
            <p className="p-heading--4 u-text-muted">
              Every {data.season_year} round. Click through for track info, travel, and track day
              availability.
            </p>
          </div>
        </div>
      </section>

      <section className="p-strip is-shallow">
        <div className="row">
          {venues.map((v) => (
            <div key={v.event_slug} className="col-4">
              <Link
                href={`/venues/${v.event_slug}`}
                className="p-card--highlighted"
                style={{ display: "block" }}
              >
                <h3 className="p-card__title">{v.location} →</h3>
                <p className="u-text-muted">
                  <small>Hosting: {v.title}</small>
                </p>
                {hasTravelGuide(v.event_slug) ? (
                  <p>
                    <span className="p-chip">
                      <span className="p-chip__value">Travel guide</span>
                    </span>
                  </p>
                ) : null}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
