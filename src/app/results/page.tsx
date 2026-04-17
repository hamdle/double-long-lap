export const metadata = {
  title: "Results",
  description: "Race-by-race MotoAmerica results, class by class.",
};

export default function ResultsPage() {
  return (
    <section className="p-strip">
      <div className="row">
        <div className="col-8">
          <h1 className="p-heading--1">Results</h1>
          <p className="p-heading--4 u-text-muted">Coming soon.</p>
          <p>
            Race-by-race results are not yet available here. In the meantime, every round links out
            to the official MotoAmerica results on the{" "}
            <a href="/schedule">schedule page</a>, and the per-class points sheets are linked from
            the <a href="/standings">standings page</a>.
          </p>
          <p>
            <span className="p-chip">
              <span className="p-chip__value">Planned for a later sprint</span>
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
