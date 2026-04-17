import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliateBlock } from "@/components/AffiliateBlock";
import { getAllRiders, getRider } from "@/lib/data";

export async function generateStaticParams() {
  const riders = await getAllRiders();
  return riders.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata(props: PageProps<"/riders/[slug]">) {
  const { slug } = await props.params;
  const rider = await getRider(slug);
  if (!rider) return { title: "Rider not found" };
  return {
    title: `${rider.name} — Rider Profile`,
    description: `MotoAmerica rider profile for ${rider.name}.`,
  };
}

export default async function RiderProfilePage(props: PageProps<"/riders/[slug]">) {
  const { slug } = await props.params;
  const rider = await getRider(slug);
  if (!rider) notFound();

  return (
    <>
      <section className="p-strip">
        <div className="row">
          <div className="col-8">
            <p>
              <Link href="/riders">← All riders</Link>
            </p>
            <h1 className="p-heading--1">{rider.name}</h1>
            <p className="p-heading--4 u-text-muted">
              {rider.bike ? `Rides a ${rider.bike}` : "MotoAmerica rider"}
            </p>
          </div>
        </div>
      </section>

      <section className="p-strip is-shallow">
        <div className="row">
          <div className="col-8">
            <h2 className="p-heading--3">Current championship</h2>
            {rider.appearances.length === 0 ? (
              <p className="u-text-muted">No current standings.</p>
            ) : (
              <table aria-label="Current championship standings">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Season</th>
                    <th className="u-align--right">Position</th>
                    <th className="u-align--right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {rider.appearances.map((a) => (
                    <tr key={`${a.class_slug}-${a.season_year}`}>
                      <td>
                        <Link href={`/standings/${a.class_slug}`}>{a.class_name}</Link>
                      </td>
                      <td>{a.season_year}</td>
                      <td className="u-align--right">
                        {a.position}
                        {a.isChampion ? " 🏆" : ""}
                      </td>
                      <td className="u-align--right">{a.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h2 className="p-heading--3">Bio</h2>
            <p className="u-text-muted">
              Full rider bio coming soon — number, team, career highlights, and career stats.
            </p>
          </div>

          <div className="col-4">
            <AffiliateBlock
              title={`Gear ${rider.name} rides with`}
              blurb={`Shop the ${rider.bike || "bike"} ecosystem — helmets, leathers, parts.`}
            />
          </div>
        </div>
      </section>
    </>
  );
}
