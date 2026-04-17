import { ImageResponse } from "next/og";
import { getRider } from "@/lib/data";

export const alt = "MotoAmerica rider profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const rider = await getRider(params.slug);
  const top = rider?.appearances[0];

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
        <div style={{ fontSize: 28, letterSpacing: 2, opacity: 0.8 }}>RIDER</div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 16, lineHeight: 1.1 }}>
          {rider?.name ?? "Rider"}
        </div>
        {top ? (
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 32 }}>
              P{top.position} · {top.class_name} · {top.points} pts ({top.season_year})
            </div>
            {rider?.bike ? (
              <div style={{ fontSize: 28, opacity: 0.75 }}>{rider.bike}</div>
            ) : null}
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
