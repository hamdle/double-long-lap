import Link from "next/link";
import { getAllRiders } from "@/lib/data";

export const metadata = {
  title: "Riders",
  description: "MotoAmerica rider profiles and career highlights.",
};

export default async function RidersPage() {
  const riders = await getAllRiders();

  return (
    <>
      <section className="p-strip">
        <div className="row">
          <div className="col-8">
            <h1 className="p-heading--1">Riders</h1>
            <p className="p-heading--4 u-text-muted">
              Every rider in the top of each class&rsquo;s current standings.
            </p>
            <p>Click a name for the profile. Bios, numbers, and team data are in progress.</p>
          </div>
        </div>
      </section>

      <section className="p-strip is-shallow">
        <div className="row">
          <div className="col-12">
            <table aria-label="Riders in current top standings">
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Bike</th>
                  <th>Classes</th>
                </tr>
              </thead>
              <tbody>
                {riders.map((r) => (
                  <tr key={r.slug}>
                    <td>
                      <Link href={`/riders/${r.slug}`}>{r.name}</Link>
                    </td>
                    <td>{r.bike || "—"}</td>
                    <td>{r.appearances.map((a) => a.class_name).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
