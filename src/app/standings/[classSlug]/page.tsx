import Link from "next/link";
import { notFound } from "next/navigation";
import { CLASS_NOTES } from "@/lib/class-notes";
import { getClassStandings, getStandings } from "@/lib/data";

export async function generateStaticParams() {
  const data = await getStandings();
  return data.classes.map((c) => ({ classSlug: c.class_slug }));
}

export async function generateMetadata(props: PageProps<"/standings/[classSlug]">) {
  const { classSlug } = await props.params;
  const cls = await getClassStandings(classSlug);
  if (!cls) return { title: "Class not found" };
  return {
    title: `${cls.class_name} Standings`,
    description: `${cls.season_year} MotoAmerica ${cls.class_name} championship standings.`,
  };
}

export default async function ClassStandingsPage(
  props: PageProps<"/standings/[classSlug]">,
) {
  const { classSlug } = await props.params;
  const cls = await getClassStandings(classSlug);
  if (!cls) notFound();
  const note = CLASS_NOTES[classSlug];

  return (
    <>
      <section className="p-strip">
        <div className="row">
          <div className="col-8">
            <p>
              <Link href="/standings">← All classes</Link>
            </p>
            <h1 className="p-heading--1">{cls.class_name}</h1>
            <p className="p-heading--4 u-text-muted">
              {cls.season_year} championship · Round {cls.round_number} · {cls.track_code}
            </p>
            {cls.full_standings_pdf_url ? (
              <p>
                <a
                  href={cls.full_standings_pdf_url}
                  className="p-button--positive"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Full standings PDF ↗
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {note ? (
        <section className="p-strip is-shallow">
          <div className="row">
            <div className="col-10">
              <aside
                className="p-notification--information"
                role="complementary"
                aria-label="Class note"
              >
                <div className="p-notification__content">{note}</div>
              </aside>
            </div>
          </div>
        </section>
      ) : null}

      <section className="p-strip is-shallow">
        <div className="row">
          <div className="col-10">
            {cls.top_riders.length === 0 ? (
              <p className="u-text-muted">No standings available for this class yet.</p>
            ) : (
              <table aria-label={`${cls.class_name} standings`}>
                <thead>
                  <tr>
                    <th style={{ width: "4rem" }}>Pos</th>
                    <th>Rider</th>
                    <th>Bike</th>
                    <th className="u-align--right" style={{ width: "6rem" }}>
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cls.top_riders.map((r) => (
                    <tr key={`${r.position}-${r.name}`}>
                      <td>{r.position}</td>
                      <td>
                        {r.name}
                        {r.isChampion ? " 🏆" : ""}
                      </td>
                      <td>{r.bike || "—"}</td>
                      <td className="u-align--right">{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="u-text-muted">
              <small>
                Showing the top riders from the latest points sheet. For the complete field, see
                the official PDF.
              </small>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
