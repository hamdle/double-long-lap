import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "scripts", "output");

type Rider = {
  position: number;
  name: string;
  points: number;
  bike: string;
  isChampion: boolean;
};

type ClassStandings = {
  class_name: string;
  class_slug: string;
  season_year: number;
  round_number: number;
  track_code: string;
  top_riders: Rider[];
};

type StandingsFile = { scraped_at: string; classes: ClassStandings[] };

type ScheduleEvent = {
  order: number;
  event_slug: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
};

type ScheduleFile = { season_year: number; events: ScheduleEvent[] };

async function readJson<T>(filename: string): Promise<T> {
  const raw = await readFile(path.join(OUT_DIR, filename), "utf8");
  return JSON.parse(raw) as T;
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

function daysUntil(dateStr: string, today: Date): number {
  const t = new Date(`${dateStr}T00:00:00`);
  return Math.ceil((t.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function leaderGap(riders: Rider[]): string {
  if (riders.length === 0) return "no data";
  const leader = riders[0];
  if (riders.length === 1) return `${leader.name} (${leader.points} pts), no second-place data`;
  const gap = leader.points - riders[1].points;
  return `${leader.name} leads ${riders[1].name} by ${gap} pts (${leader.points} vs ${riders[1].points})`;
}

async function main() {
  const standings = await readJson<StandingsFile>("standings.json");
  const schedule = await readJson<ScheduleFile>("schedule.json");

  const today = new Date();
  const nextEvent = schedule.events.find((e) => {
    const end = new Date(`${e.end_date}T23:59:59`);
    return end >= today;
  });

  const lines: string[] = [];
  lines.push(`# MotoAmerica ${schedule.season_year} — Fan Hub Stats Packet`);
  lines.push("");
  lines.push(`*Generated ${today.toISOString().slice(0, 10)} by Double Long Lap.*`);
  lines.push("");
  lines.push(
    "Double Long Lap is a fan-run MotoAmerica hub publishing standings, schedule, results, rider profiles, and venue guides. This packet summarizes the current season and the next round. Reach out at hello@doublelonglap.com.",
  );
  lines.push("");

  if (nextEvent) {
    const days = daysUntil(nextEvent.start_date, today);
    const when =
      days <= 0 && new Date(`${nextEvent.end_date}T23:59:59`) >= today
        ? "this weekend"
        : `in ${days} day${days === 1 ? "" : "s"}`;
    lines.push(`## Next round: ${nextEvent.title}`);
    lines.push("");
    lines.push(`- **When:** ${formatDateRange(nextEvent.start_date, nextEvent.end_date)} (${when})`);
    lines.push(`- **Where:** ${nextEvent.location}`);
    lines.push(`- **Round:** ${nextEvent.order} of ${schedule.events.length}`);
    lines.push("");
  }

  lines.push("## Championship snapshot");
  lines.push("");
  for (const c of standings.classes) {
    lines.push(`### ${c.class_name} (${c.season_year})`);
    lines.push("");
    lines.push(`- After round ${c.round_number} at ${c.track_code}`);
    lines.push(`- ${leaderGap(c.top_riders)}`);
    if (c.top_riders[0]?.isChampion) {
      lines.push(`- **${c.top_riders[0].name}** clinched the ${c.season_year} title.`);
    }
    lines.push("");
    lines.push("| Pos | Rider | Bike | Points |");
    lines.push("|---|---|---|---|");
    for (const r of c.top_riders.slice(0, 5)) {
      lines.push(`| ${r.position} | ${r.name}${r.isChampion ? " 🏆" : ""} | ${r.bike || "—"} | ${r.points} |`);
    }
    lines.push("");
  }

  lines.push("## Full schedule");
  lines.push("");
  lines.push("| Rd | Event | Venue | Dates |");
  lines.push("|---|---|---|---|");
  for (const e of schedule.events) {
    lines.push(`| ${e.order} | ${e.title} | ${e.location} | ${formatDateRange(e.start_date, e.end_date)} |`);
  }
  lines.push("");

  lines.push("---");
  lines.push("");
  lines.push(
    `*Source: scraped from motoamerica.com. Standings snapshot taken ${standings.scraped_at}. Contact ericmarty@protonmail.com for custom cuts.*`,
  );

  await mkdir(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, "stats-packet.md");
  await writeFile(outPath, lines.join("\n"), "utf8");
  console.log(`Wrote ${outPath} (${lines.length} lines)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
