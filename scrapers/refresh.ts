import { spawn } from 'node:child_process';

const steps: Array<{ name: string; cmd: string; args: string[] }> = [
  { name: 'scrape standings', cmd: 'npx', args: ['tsx', 'scrapers/scrape-standings.ts'] },
  { name: 'scrape schedule', cmd: 'npx', args: ['tsx', 'scrapers/scrape-schedule.ts'] },
  { name: 'scrape classes', cmd: 'npx', args: ['tsx', 'scrapers/scrape-classes.ts'] },
  { name: 'scrape riders', cmd: 'npx', args: ['tsx', 'scrapers/scrape-riders.ts'] },
  { name: 'scrape event PDFs', cmd: 'npx', args: ['tsx', 'scrapers/scrape-event-pdfs.ts'] },
  { name: 'generate stats packet', cmd: 'npx', args: ['tsx', 'scrapers/generate-stats-packet.ts'] },
];

function run(step: (typeof steps)[number]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n━━━ ${step.name} ━━━`);
    const child = spawn(step.cmd, step.args, { stdio: 'inherit', shell: false });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${step.name} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function main(): Promise<void> {
  const start = Date.now();
  for (const step of steps) await run(step);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✓ Refresh complete in ${elapsed}s`);
  console.log('  - scrapers/output/standings.json');
  console.log('  - scrapers/output/schedule.json');
  console.log('  - scrapers/output/classes.json');
  console.log('  - scrapers/output/riders.json');
  console.log('  - scrapers/output/event-pdfs.json');
  console.log('  - scrapers/output/stats-packet.md');
  console.log('\nRe-run `npm run build` to embed the new data into the Angular bundle.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
