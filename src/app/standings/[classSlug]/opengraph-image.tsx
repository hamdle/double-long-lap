import { ImageResponse } from "next/og";
import { getClassGuide, getClassStandings, getKnownClassSlugs } from "@/lib/data";

export const alt = "MotoAmerica class standings";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export async function generateStaticParams() {
  const slugs = await getKnownClassSlugs();
  return slugs.map((classSlug) => ({ classSlug }));
}

export default async function Image({ params }: { params: Promise<{ classSlug: string }> }) {
  const { classSlug } = await params;
  const [cls, guide] = await Promise.all([
    getClassStandings(classSlug),
    getClassGuide(classSlug),
  ]);
  const leader = cls?.top_riders[0];
  const displayName = cls?.class_name ?? guide?.display_name ?? "Class";
  const seasonLine = cls ? `STANDINGS · ${cls.season_year}` : "CLASS GUIDE";

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
        <div style={{ fontSize: 28, letterSpacing: 2, opacity: 0.8 }}>{seasonLine}</div>
        <div style={{ fontSize: 88, fontWeight: 700, marginTop: 16 }}>{displayName}</div>
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
              {`${leader.points} pts${leader.bike ? ` · ${leader.bike}` : ""}`}
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
