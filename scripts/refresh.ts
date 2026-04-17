import { spawn } from "node:child_process";

const steps: Array<{ name: string; cmd: string; args: string[] }> = [
  { name: "scrape standings", cmd: "npx", args: ["tsx", "scripts/scrape-standings.ts"] },
  { name: "scrape schedule", cmd: "npx", args: ["tsx", "scripts/scrape-schedule.ts"] },
  { name: "generate stats packet", cmd: "npx", args: ["tsx", "scripts/generate-stats-packet.ts"] },
];

function run(step: (typeof steps)[number]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n━━━ ${step.name} ━━━`);
    const child = spawn(step.cmd, step.args, { stdio: "inherit", shell: false });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${step.name} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

async function main() {
  const start = Date.now();
  for (const step of steps) await run(step);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✓ Refresh complete in ${elapsed}s`);
  console.log("  - scripts/output/standings.json");
  console.log("  - scripts/output/schedule.json");
  console.log("  - scripts/output/stats-packet.md");
  console.log("\nCommit the scraped data? It's gitignored by default.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
