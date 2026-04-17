import Link from "next/link";
import { Sponsorship } from "@/components/Sponsorship";
import { getStandings } from "@/lib/data";

export const metadata = {
  title: "Standings",
  description: "MotoAmerica championship standings across every class.",
};

function formatScrapedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function StandingsPage() {
  const data = await getStandings();

  return (
    <>
      <section className="p-strip">
        <div className="row">
          <div className="col-8">
            <h1 className="p-heading--1">Standings</h1>
            <p className="p-heading--4 u-text-muted">
              Championship points across every MotoAmerica class.
            </p>
            <p>
              <small className="u-text-muted">
                Updated {formatScrapedAt(data.scraped_at)} from{" "}
                <a href={data.source_url}>motoamerica.com/standings</a>.
              </small>
            </p>
          </div>
        </div>
      </section>

      <section className="p-strip is-shallow">
        <div className="row">
          <div className="col-12">
            <Sponsorship section="standings" />
          </div>
        </div>
        <div className="row">
          {data.classes.map((c) => {
            const leader = c.top_riders[0];
            return (
              <div key={c.class_slug} className="col-6">
                <Link
                  href={`/standings/${c.class_slug}`}
                  className="p-card--highlighted"
                  style={{ display: "block" }}
                >
                  <h3 className="p-card__title">
                    {c.class_name} →
                  </h3>
                  <p className="u-text-muted">
                    <small>
                      {c.season_year} · Round {c.round_number} · {c.track_code}
                    </small>
                  </p>
                  {leader ? (
                    <p>
                      <strong>Leader:</strong> {leader.name}
                      {leader.isChampion ? " 🏆" : ""} — {leader.points} pts
                      {leader.bike ? ` (${leader.bike})` : ""}
                    </p>
                  ) : (
                    <p className="u-text-muted">No standings yet.</p>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
