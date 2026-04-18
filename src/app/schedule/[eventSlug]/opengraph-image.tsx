import { ImageResponse } from "next/og";
import { getSchedule, getVenue } from "@/lib/data";

export const alt = "MotoAmerica race weekend";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export async function generateStaticParams() {
  const data = await getSchedule();
  return data.events.map((e) => ({ eventSlug: e.event_slug }));
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  const month = s.toLocaleString("en-US", { month: "long" });
  const year = s.getFullYear();
  if (s.getMonth() === e.getMonth()) {
    return `${month} ${s.getDate()}–${e.getDate()}, ${year}`;
  }
  const endMonth = e.toLocaleString("en-US", { month: "long" });
  return `${month} ${s.getDate()} – ${endMonth} ${e.getDate()}, ${year}`;
}

export default async function Image({ params }: { params: Promise<{ eventSlug: string }> }) {
  const { eventSlug } = await params;
  const event = await getVenue(eventSlug);

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
          {`RACE WEEKEND · ROUND ${event?.order ?? "?"}`}
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            marginTop: 16,
            lineHeight: 1.1,
          }}
        >
          {event?.title ?? "Race weekend"}
        </div>
        {event ? (
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 40, fontWeight: 600 }}>{event.location}</div>
            <div style={{ fontSize: 32, opacity: 0.8 }}>
              {formatDateRange(event.start_date, event.end_date)}
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
