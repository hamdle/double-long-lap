// Generates the single fallback OG image used by every page (per locked
// migration decision #2 — simplify; revisit per-route OG later). Renders an
// SVG with Vanilla's brand palette and writes a 1200×630 PNG into public/.
// Angular's build copies public/ into the dist output, so the file ends up
// at /og-default.png in the deployed site.
//
// Run via `npm run build-og` or automatically as part of `prebuild`.

import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_FILE = join(ROOT, 'public', 'og-default.png');

const WIDTH = 1200;
const HEIGHT = 630;
const UBUNTU_ORANGE = '#E95420';
const SURFACE_DARK = '#1c1c1c';
const TEXT = '#FFFFFF';
const MUTED = 'rgba(255, 255, 255, 0.7)';

// Inline SVG. resvg embeds Liberation Sans by default which is metrics-
// compatible with Arial / common system sans — close enough to Ubuntu for a
// bitmap baked once and shared everywhere.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${SURFACE_DARK}" />
  <rect x="0" y="0" width="${WIDTH}" height="14" fill="${UBUNTU_ORANGE}" />
  <g font-family="Helvetica, Arial, sans-serif" fill="${TEXT}">
    <text x="80" y="240" font-size="120" font-weight="700" letter-spacing="-2">Double Long Lap</text>
    <text x="80" y="320" font-size="44" font-weight="400" fill="${MUTED}">The MotoAmerica fan hub.</text>
    <text x="80" y="540" font-size="28" font-weight="400" fill="${MUTED}">
      Standings · Schedule · Results · Riders · Venues
    </text>
    <text x="80" y="582" font-size="22" font-weight="400" fill="${UBUNTU_ORANGE}">doublelonglap.com</text>
  </g>
</svg>
`.trim();

const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
const png = resvg.render().asPng();
writeFileSync(OUT_FILE, png);

// eslint-disable-next-line no-console
console.log(`build-og: wrote ${OUT_FILE} (${png.byteLength} bytes)`);
