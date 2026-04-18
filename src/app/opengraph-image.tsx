import { ImageResponse } from "next/og";

export const alt = "Double Long Lap — MotoAmerica fan hub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #091055 0%, #1a1f5c 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: 2 }}>
          DOUBLE LONG LAP
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            <div>The MotoAmerica</div>
            <div>fan hub.</div>
          </div>
          <div style={{ fontSize: 32, opacity: 0.8 }}>
            Standings · Schedule · Results · Riders · Venues
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 24,
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
