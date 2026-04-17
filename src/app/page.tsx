import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";

const sections = [
  { href: "/standings", title: "Standings", blurb: "Championship points across every MotoAmerica class." },
  { href: "/schedule", title: "Schedule", blurb: "The 2026 calendar with countdown to the next round." },
  { href: "/results", title: "Results", blurb: "Race-by-race results, class by class." },
  { href: "/riders", title: "Riders", blurb: "Profiles, numbers, teams, career highlights." },
  { href: "/venues", title: "Venues", blurb: "Track info, travel guides, track day availability." },
];

export default function Home() {
  return (
    <>
      <section className="p-strip">
        <div className="row">
          <div className="col-8">
            <h1 className="p-heading--1">The MotoAmerica fan hub.</h1>
            <p className="p-heading--4 u-text-muted">
              Standings, schedule, results, rider profiles, and venue guides — all in one place.
              Free, fan-built, and growing with the sport.
            </p>
            <p>
              <span className="p-chip">
                <span className="p-chip__value">Newsletter signup coming soon</span>
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="p-strip is-shallow">
        <div className="row">
          <div className="col-12">
            <AdSlot placement="home-top" size="leaderboard" />
          </div>
        </div>
        <div className="row">
          {sections.map((s) => (
            <div key={s.href} className="col-4">
              <Link href={s.href} className="p-card--highlighted" style={{ display: "block" }}>
                <h3 className="p-card__title">{s.title} →</h3>
                <p>{s.blurb}</p>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
