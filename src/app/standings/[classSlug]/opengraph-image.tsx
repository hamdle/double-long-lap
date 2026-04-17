import { ImageResponse } from "next/og";
import { getClassStandings } from "@/lib/data";

export const alt = "MotoAmerica class standings";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { classSlug: string } }) {
  const cls = await getClassStandings(params.classSlug);
  const leader = cls?.top_riders[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 80,
          background: "#091055",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 2, opacity: 0.8 }}>
          STANDINGS · {cls?.season_year ?? ""}
        </div>
        <div style={{ fontSize: 88, fontWeight: 700, marginTop: 16 }}>
          {cls?.class_name ?? "Class"}
        </div>
        {leader ? (
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 24, opacity: 0.75 }}>
              {leader.isChampion ? "Champion" : "Championship leader"}
            </div>
            <div style={{ fontSize: 64, fontWeight: 700 }}>{leader.name}</div>
            <div style={{ fontSize: 32 }}>
              {leader.points} pts{leader.bike ? ` · ${leader.bike}` : ""}
            </div>
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 24,
            marginTop: 40,
          }}
        >
          <div style={{ width: 60, height: 8, background: "#d82631" }} />
          <div>doublelonglap.com</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
