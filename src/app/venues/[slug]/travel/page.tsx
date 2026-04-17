import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliateBlock } from "@/components/AffiliateBlock";
import { getVenue } from "@/lib/data";
import {
  TRAVEL_GUIDE_SLUGS,
  TRAVEL_GUIDES,
  hasTravelGuide,
} from "@/lib/travel-guides";

export function generateStaticParams() {
  return TRAVEL_GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/venues/[slug]/travel">) {
  const { slug } = await props.params;
  if (!hasTravelGuide(slug)) return { title: "Travel guide" };
  const g = TRAVEL_GUIDES[slug];
  return { title: g.title, description: g.subtitle };
}

export default async function TravelGuidePage(props: PageProps<"/venues/[slug]/travel">) {
  const { slug } = await props.params;
  if (!hasTravelGuide(slug)) notFound();
  const guide = TRAVEL_GUIDES[slug];
  const venue = await getVenue(slug);

  return (
    <>
      <section className="p-strip">
        <div className="row">
          <div className="col-8">
            <p>
              <Link href={`/venues/${slug}`}>← {venue?.location ?? "Back to venue"}</Link>
            </p>
            <h1 className="p-heading--1">{guide.title}</h1>
            <p className="p-heading--4 u-text-muted">{guide.subtitle}</p>
          </div>
        </div>
      </section>

      <section className="p-strip is-shallow">
        <div className="row">
          <div className="col-8">
            <h2 className="p-heading--3">Getting there</h2>
            <ul>
              {guide.nearestAirports.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            {guide.drivingNote ? <p>{guide.drivingNote}</p> : null}

            <h2 className="p-heading--3">Where to stay</h2>
            {guide.hotelNote ? <p>{guide.hotelNote}</p> : null}

            {guide.foodNote ? (
              <>
                <h2 className="p-heading--3">Food</h2>
                <p>{guide.foodNote}</p>
              </>
            ) : null}

            <h2 className="p-heading--3">Things to do</h2>
            <ul>
              {guide.thingsToDo.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>

            <h2 className="p-heading--3">Track days</h2>
            {guide.trackDayNote ? <p>{guide.trackDayNote}</p> : null}
          </div>

          <div className="col-4">
            <AffiliateBlock
              title="Hotels near the track"
              blurb="Book a room for race weekend."
              links={guide.hotelLinks}
            />
            <AffiliateBlock
              title="Track days here"
              blurb="Ride the circuit yourself."
              links={guide.trackDayLinks}
            />
          </div>
        </div>
      </section>
    </>
  );
}
