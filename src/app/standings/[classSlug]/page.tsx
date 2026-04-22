import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassGuide } from "@/components/ClassGuide";
import { ClassGridTable } from "@/components/ClassGridTable";
import { CLASS_NOTES } from "@/lib/class-notes";
import {
  getClassGrid,
  getClassGuide,
  getClassStandings,
  getKnownClassSlugs,
} from "@/lib/data";

export async function generateStaticParams() {
  const slugs = await getKnownClassSlugs();
  return slugs.map((classSlug) => ({ classSlug }));
}

export async function generateMetadata(props: PageProps<"/standings/[classSlug]">) {
  const { classSlug } = await props.params;
  const [cls, guide] = await Promise.all([
    getClassStandings(classSlug),
    getClassGuide(classSlug),
  ]);
  if (!cls && !guide) return { title: "Class not found" };
  const name = cls?.class_name ?? guide?.display_name ?? "Class";
  const year = cls?.season_year;
  return {
    title: `${name} Standings`,
    description: year
      ? `${year} MotoAmerica ${name} championship standings.`
      : `MotoAmerica ${name} class guide.`,
  };
}

export default async function ClassStandingsPage(
  props: PageProps<"/standings/[classSlug]">,
) {
  const { classSlug } = await props.params;
  const [cls, guide, grid] = await Promise.all([
    getClassStandings(classSlug),
    getClassGuide(classSlug),
    getClassGrid(classSlug),
  ]);
  if (!cls && !guide) notFound();
  const displayName = cls?.class_name ?? guide?.display_name ?? "Class";
  const note = CLASS_NOTES[classSlug];

  return (
    <>
      <section className="p-strip">
        <div className="row">
          <div className="col-8">
            <p>
              <Link href="/standings">← All classes</Link>
            </p>
            <h1 className="p-heading--1">{displayName}</h1>
            {cls ? (
              <p className="p-heading--4 u-text-muted">
                {cls.season_year} championship · Round {cls.round_number} · {cls.track_code}
              </p>
            ) : (
              <p className="p-heading--4 u-text-muted">
                MotoAmerica class — no season-long standings published.
              </p>
            )}
            {cls?.full_standings_pdf_url ? (
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

      {guide ? <ClassGuide guide={guide} /> : null}

      <section className="p-strip is-shallow">
        <div className="row">
          <div className="col-12">
            <h2 className="p-heading--3">Standings &amp; grid</h2>
            {!cls && grid.length === 0 ? (
              <p className="u-text-muted">
                This class doesn&rsquo;t publish a season-long championship — results are scored
                per event rather than rolled up into a points table.
              </p>
            ) : grid.length === 0 ? (
              <p className="u-text-muted">No rider data available for this class yet.</p>
            ) : (
              <>
                <ClassGridTable riders={grid} className={displayName} />
                <p className="u-text-muted">
                  <small>
                    Tap a column header to sort. Ranked riders come from the latest points sheet;
                    unranked entries are pulled from the class roster.
                    {cls?.full_standings_pdf_url ? " See the PDF for the complete results." : ""}
                  </small>
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
