// Walks both deployments and reports which "real" URLs are present in the
// legacy Next out/ but missing from the new Angular dist/. Exits non-zero
// if anything's missing so it can gate the cutover commit.
//
// Run via `npm run diff-routes` (manual; not part of the normal build).

import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LEGACY_OUT = join(ROOT, 'legacy-next', 'out');
const NG_OUT = join(ROOT, 'dist', 'dll', 'browser');

// Skip Next-internal / framework artifacts that don't correspond to
// user-visible URLs.
const SKIP_PATTERNS = [
  /^\/_next\//,
  /\/opengraph-image(\.png)?\/index\.html$/,
  /\/opengraph-image\.png$/,
  /\/__next\./,
  /^\/404(\.html)?\/?$/,
  /^\/_not-found\/?$/, // Next's internal 404 catch-all, not a real user URL
];

function shouldSkip(urlPath: string): boolean {
  return SKIP_PATTERNS.some((re) => re.test(urlPath));
}

function listIndexHtmlPaths(root: string): string[] {
  if (!existsSync(root)) {
    throw new Error(`Directory not found: ${root}`);
  }
  const out: string[] = [];
  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (entry === 'index.html') {
        // Map dist/.../browser/standings/superbike/index.html → /standings/superbike/
        const rel = '/' + relative(root, full).replace(/\/index\.html$/, '/');
        const url = rel === '//' ? '/' : rel;
        out.push(url);
      }
    }
  }
  walk(root);
  return out;
}

function format(urls: string[]): string {
  return urls
    .slice()
    .sort()
    .map((u) => `  ${u}`)
    .join('\n');
}

const legacyAll = listIndexHtmlPaths(LEGACY_OUT);
const ngAll = listIndexHtmlPaths(NG_OUT);

const legacy = legacyAll.filter((u) => !shouldSkip(u));
const ng = ngAll.filter((u) => !shouldSkip(u));

const legacySet = new Set(legacy);
const ngSet = new Set(ng);

const missingInNg = legacy.filter((u) => !ngSet.has(u));
const extraInNg = ng.filter((u) => !legacySet.has(u));

console.log(`Legacy out/ : ${legacy.length} URLs (${legacyAll.length} total, ${legacyAll.length - legacy.length} skipped)`);
console.log(`Angular dist: ${ng.length} URLs (${ngAll.length} total, ${ngAll.length - ng.length} skipped)`);
console.log('');

if (missingInNg.length === 0) {
  console.log(`✓ Every legacy URL is present in the Angular build.`);
} else {
  console.log(`✗ ${missingInNg.length} URL(s) in legacy but missing from Angular:`);
  console.log(format(missingInNg));
}

if (extraInNg.length > 0) {
  console.log('');
  console.log(`(For info) ${extraInNg.length} URL(s) only in Angular:`);
  console.log(format(extraInNg));
}

process.exit(missingInNg.length === 0 ? 0 : 1);
