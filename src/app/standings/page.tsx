import Link from "next/link";
import { Sponsorship } from "@/components/Sponsorship";
import { getStandings, type ClassStandings } from "@/lib/data";

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

function ClassCard({ cls }: { cls: ClassStandings }) {
  const leader = cls.top_riders[0];
  return (
    <div className="col-6">
      <Link
        href={`/standings/${cls.class_slug}`}
        className="p-card--highlighted"
        style={{ display: "block" }}
      >
        <h3 className="p-card__title">{cls.class_name} →</h3>
        <p className="u-text-muted">
          <small>
            {cls.season_year} · Round {cls.round_number} · {cls.track_code}
          </small>
        </p>
        {leader ? (
          <p>
            <strong>{leader.isChampion ? "Champion:" : "Leader:"}</strong> {leader.name}
            {leader.isChampion ? " 🏆" : ""} — {leader.points} pts
            {leader.bike ? ` (${leader.bike})` : ""}
          </p>
        ) : (
          <p className="u-text-muted">No standings yet.</p>
        )}
      </Link>
    </div>
  );
}

export default async function StandingsPage() {
  const data = await getStandings();
  const bySeason = new Map<number, ClassStandings[]>();
  for (const c of data.classes) {
    const list = bySeason.get(c.season_year) ?? [];
    list.push(c);
    bySeason.set(c.season_year, list);
  }
  const seasons = Array.from(bySeason.keys()).sort((a, b) => b - a);
  const currentSeason = seasons[0];

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
      </section>

      {seasons.map((year) => {
        const classes = bySeason.get(year) ?? [];
        const isCurrent = year === currentSeason;
        return (
          <section key={year} className="p-strip is-shallow">
            <div className="row">
              <div className="col-12">
                <h2 className="p-heading--2">
                  {year}
                  {isCurrent ? (
                    <>
                      {" "}
                      <span className="p-chip">
                        <span className="p-chip__value">Current season</span>
                      </span>
                    </>
                  ) : (
                    <>
                      {" "}
                      <span className="u-text-muted" style={{ fontSize: "1rem" }}>
                        — final standings
                      </span>
                    </>
                  )}
                </h2>
                {!isCurrent ? (
                  <p className="u-text-muted">
                    <small>
                      Classes that haven&rsquo;t raced yet in {currentSeason}. These show the
                      final {year} standings until the new season&rsquo;s first round is scored.
                    </small>
                  </p>
                ) : null}
              </div>
            </div>
            <div className="row">
              {classes.map((c) => (
                <ClassCard key={c.class_slug} cls={c} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
