"use client";

import { useMemo, useState } from "react";
import type { ClassGridRider } from "@/lib/data";
import { flagEmoji } from "@/lib/country";

type SortKey = "position" | "number" | "rider" | "manufacturer" | "nationality" | "points";
type SortDir = "asc" | "desc";

type Props = {
  riders: ClassGridRider[];
  className: string;
};

// Unranked riders (no championship position yet) sort after ranked ones in
// ascending mode and before in descending mode, so the user always sees "the
// meaningful rows first" regardless of direction.
function compare(a: ClassGridRider, b: ClassGridRider, key: SortKey, dir: SortDir): number {
  const mult = dir === "asc" ? 1 : -1;
  const nullsLast = (hasA: boolean, hasB: boolean): number | null => {
    if (hasA && !hasB) return -1;
    if (!hasA && hasB) return 1;
    if (!hasA && !hasB) return a.name.localeCompare(b.name);
    return null;
  };

  switch (key) {
    case "position": {
      const tie = nullsLast(a.position != null, b.position != null);
      if (tie != null) return tie;
      return (a.position! - b.position!) * mult;
    }
    case "number": {
      const tie = nullsLast(a.number != null, b.number != null);
      if (tie != null) return tie;
      return (a.number! - b.number!) * mult;
    }
    case "points": {
      const tie = nullsLast(a.points != null, b.points != null);
      if (tie != null) return tie;
      return (a.points! - b.points!) * mult;
    }
    case "rider":
      return a.name.localeCompare(b.name) * mult;
    case "manufacturer": {
      const am = a.bike_manufacturer ?? "";
      const bm = b.bike_manufacturer ?? "";
      const tie = nullsLast(!!am, !!bm);
      if (tie != null) return tie;
      return (am.localeCompare(bm) || a.name.localeCompare(b.name)) * mult;
    }
    case "nationality": {
      const an = a.nationality ?? "";
      const bn = b.nationality ?? "";
      const tie = nullsLast(!!an, !!bn);
      if (tie != null) return tie;
      return (an.localeCompare(bn) || a.name.localeCompare(b.name)) * mult;
    }
  }
}

const DEFAULT_DIR: Record<SortKey, SortDir> = {
  position: "asc",
  number: "asc",
  rider: "asc",
  manufacturer: "asc",
  nationality: "asc",
  points: "desc",
};

export function ClassGridTable({ riders, className }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("position");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const copy = [...riders];
    copy.sort((a, b) => compare(a, b, sortKey, sortDir));
    return copy;
  }, [riders, sortKey, sortDir]);

  function clickHeader(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(DEFAULT_DIR[key]);
    }
  }

  function arrow(key: SortKey): string {
    if (key !== sortKey) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  function Header({ k, label, align }: { k: SortKey; label: string; align?: "right" }) {
    const isActive = k === sortKey;
    return (
      <th
        aria-sort={isActive ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
        className={align === "right" ? "u-align--right" : undefined}
      >
        <button
          type="button"
          onClick={() => clickHeader(k)}
          className="p-button--base"
          style={{
            padding: 0,
            margin: 0,
            background: "none",
            border: "none",
            font: "inherit",
            color: "inherit",
            cursor: "pointer",
            fontWeight: isActive ? 600 : 400,
          }}
        >
          {label}
          {arrow(k)}
        </button>
      </th>
    );
  }

  return (
    <table aria-label={`${className} standings and grid`}>
      <thead>
        <tr>
          <Header k="position" label="Pos" />
          <Header k="number" label="#" />
          <Header k="rider" label="Rider" />
          <Header k="nationality" label="Country" />
          <Header k="manufacturer" label="Bike" />
          <Header k="points" label="Points" align="right" />
        </tr>
      </thead>
      <tbody>
        {sorted.map((r) => {
          const flag = flagEmoji(r.nationality);
          return (
            <tr key={r.slug}>
              <td>{r.position ?? "—"}</td>
              <td>{r.number ?? "—"}</td>
              <td>
                <strong>{r.name}</strong>
                {r.isChampion ? " 🏆" : ""}
                {r.team ? (
                  <>
                    <br />
                    <small className="u-text-muted">{r.team}</small>
                  </>
                ) : null}
              </td>
              <td>
                {flag ? (
                  <span aria-hidden="true" style={{ marginRight: "0.35rem" }}>
                    {flag}
                  </span>
                ) : null}
                {r.nationality ?? "—"}
              </td>
              <td>
                {r.bike ?? "—"}
                {r.bike_manufacturer && r.bike && r.bike_manufacturer !== r.bike ? (
                  <>
                    <br />
                    <small className="u-text-muted">{r.bike_manufacturer}</small>
                  </>
                ) : null}
              </td>
              <td className="u-align--right">{r.points ?? "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
