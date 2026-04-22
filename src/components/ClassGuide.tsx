import type { ClassGuide as ClassGuideData } from "@/lib/data";

type Props = { guide: ClassGuideData };

// Gradient placeholder for the class-guide hero. Will be swapped for a per-class
// image (authored content in src/data/class-guides.ts → `image`) later.
function HeroPlaceholder({ label }: { label: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: "100%",
        aspectRatio: "3 / 1",
        borderRadius: "0.25rem",
        marginBottom: "1rem",
        background:
          "linear-gradient(135deg, #091055 0%, #1d3d8c 55%, #d82631 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.7)",
        fontSize: "0.875rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <tr>
      <th scope="row" style={{ width: "14rem" }}>
        {label}
      </th>
      <td style={{ whiteSpace: "pre-line" }}>{value}</td>
    </tr>
  );
}

export function ClassGuide({ guide }: Props) {
  const hasAnySpec =
    guide.engine_configurations || guide.minimum_weight || guide.rider_age_limit;

  return (
    <section className="p-strip is-shallow" aria-labelledby="class-guide-heading">
      <div className="row">
        <div className="col-10">
          <article className="p-card--highlighted">
            <header>
              <p className="u-text-muted" style={{ marginBottom: "0.25rem" }}>
                <small style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Class guide
                </small>
              </p>
              <h2 id="class-guide-heading" className="p-heading--3">
                {guide.tagline}
              </h2>
            </header>

            {guide.image ? null : <HeroPlaceholder label={guide.display_name} />}

            {guide.blurb ? <p>{guide.blurb}</p> : null}

            <h3 className="p-heading--5">What you&rsquo;re watching</h3>
            <p>{guide.what_you_watch}</p>

            {hasAnySpec ? (
              <>
                <h3 className="p-heading--5">Rules</h3>
                <table aria-label={`${guide.display_name} technical rules`}>
                  <tbody>
                    <SpecRow label="Engine configurations" value={guide.engine_configurations} />
                    <SpecRow label="Minimum weight" value={guide.minimum_weight} />
                    <SpecRow label="Rider age limit" value={guide.rider_age_limit} />
                  </tbody>
                </table>
              </>
            ) : null}

            <h3 className="p-heading--5">Eligible bikes</h3>
            <p>{guide.eligible_bikes}</p>

            {guide.notes ? (
              <aside
                className="p-notification--information"
                role="complementary"
                aria-label="Class note"
                style={{ marginTop: "1rem" }}
              >
                <div className="p-notification__content">
                  <p>{guide.notes}</p>
                </div>
              </aside>
            ) : null}

            {guide.source_url ? (
              <p className="u-text-muted" style={{ marginTop: "1rem" }}>
                <small>
                  Rules sourced from{" "}
                  <a href={guide.source_url} target="_blank" rel="noopener noreferrer">
                    motoamerica.com
                  </a>
                  .
                </small>
              </p>
            ) : null}
          </article>
        </div>
      </div>
    </section>
  );
}
