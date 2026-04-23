// Codegen step that inlines the scraped JSON snapshots into a typed TS module
// the Angular build can import directly. Replaces the previous Next.js pattern
// of reading JSON via node:fs at build time — Angular's static prerender
// pipeline benefits from having the data in the module graph (tree-shakable,
// no asynchronous I/O during prerender).
//
// Source:  legacy-next/scripts/output/<name>.json
// Output:  src/app/data/generated.ts
//
// Run via `npm run embed-data` or automatically as `prebuild`.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SOURCE_DIR = join(ROOT, 'scrapers', 'output');
const OUT_FILE = join(ROOT, 'src', 'app', 'data', 'generated.ts');

type Source = { name: string; constName: string; typeName: string };

const SOURCES: Source[] = [
  { name: 'standings.json', constName: 'STANDINGS', typeName: 'StandingsFile' },
  { name: 'schedule.json', constName: 'SCHEDULE', typeName: 'ScheduleFile' },
  { name: 'classes.json', constName: 'CLASS_RULES', typeName: 'ClassRulesFile' },
  { name: 'riders.json', constName: 'ROSTERS', typeName: 'RostersFile' },
];

function readJson(name: string): unknown {
  const path = join(SOURCE_DIR, name);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'ENOENT') {
      throw new Error(
        `Missing scraped data file: ${path}\n` +
          `Refresh the scraped data before building:\n` +
          `  npm run refresh`,
      );
    }
    throw err;
  }
}

function main(): void {
  const banner = [
    '// AUTO-GENERATED. Do not edit by hand.',
    '// Source: legacy-next/scripts/output/*.json',
    '// Regenerate via: npm run embed-data',
    '',
    "import type {",
    '  StandingsFile,',
    '  ScheduleFile,',
    '  ClassRulesFile,',
    '  RostersFile,',
    "} from './data-types';",
    '',
  ].join('\n');

  const blocks = SOURCES.map(({ name, constName, typeName }) => {
    const data = readJson(name);
    const literal = JSON.stringify(data, null, 2);
    return `export const ${constName}: ${typeName} = ${literal} satisfies ${typeName};\n`;
  });

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, banner + blocks.join('\n'));
  // eslint-disable-next-line no-console
  console.log(
    `embed-data: wrote ${OUT_FILE} (${SOURCES.map((s) => s.constName).join(', ')})`,
  );
}

main();
