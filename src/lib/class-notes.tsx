import Link from "next/link";
import type { ReactNode } from "react";

export const CLASS_NOTES: Record<string, ReactNode> = {
  superbike: (
    <>
      <p>
        <strong>Starting 2026, the Superbike Cup runs within the Superbike class.</strong> The
        former Stock 1000 class was rebranded as the{" "}
        <Link href="/standings/superbike-cup">MotoAmerica Superbike Cup</Link> and is now folded
        into the premier grid. Cup riders compete in the same 20 races across all nine venues and
        earn points for both championships — a Cup rider can appear on both the Superbike and
        Superbike Cup podiums.
      </p>
      <p className="u-text-muted">
        <small>
          The Superbike rules package is locked through the 2027 season. See also the historical{" "}
          <Link href="/standings/stock-1000">Stock 1000 standings</Link>.
        </small>
      </p>
    </>
  ),
  "stock-1000": (
    <>
      <p>
        <strong>2025 was the final standalone Stock 1000 season.</strong> Beginning in 2026, the
        class was rebranded as the{" "}
        <Link href="/standings/superbike-cup">MotoAmerica Superbike Cup</Link> and is now run
        within the <Link href="/standings/superbike">Superbike</Link> class — Cup riders race
        alongside the Superbike grid and earn points for both championships.
      </p>
    </>
  ),
  "superbike-cup": (
    <>
      <p>
        <strong>The Superbike Cup is the rebranded Stock 1000 class, new for 2026.</strong> Cup
        riders compete within the <Link href="/standings/superbike">Superbike</Link> grid at all
        20 races across nine venues and earn points for both championships. A Cup rider can finish
        on both the Superbike and Superbike Cup podiums in the same race.
      </p>
      <p className="u-text-muted">
        <small>
          See also the historical <Link href="/standings/stock-1000">Stock 1000 standings</Link>.
        </small>
      </p>
    </>
  ),
};
