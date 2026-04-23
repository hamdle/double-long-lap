// Shared HTTP helpers for scrapers. Identify ourselves honestly in the User-Agent —
// site operators generally appreciate it, and it makes blocking targeted-not-blanket.

export const USER_AGENT =
  "DoubleLongLapBot/0.1 (+https://doublelonglap.com; MotoAmerica fan stats project)";

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} fetching ${url}`);
  return res.text();
}
