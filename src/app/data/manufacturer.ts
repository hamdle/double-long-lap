// Manufacturer color map for the classification-table position stripe.
//
// Phase 2 scope: 4px left-edge stripe only — no row-bg bleed, no badge fill.
// The stripe reads as a quiet metadata accent; brand-red semantics (live,
// active, primary CTA) stay reserved for the app's red.
//
// MotoGP-class manufacturers use the exact hex values MotoGP.com ships on its
// classification table. MA-only manufacturers (BMW, Suzuki, Kawasaki, Triumph)
// use brand colors picked from each company's design system. Every entry has
// a dark-mode variant brightened to read against the app's near-black
// surface-900 (#0d0d10) — Yamaha navy, Ducati deep red, Suzuki blue all fall
// below a ~40% luminance threshold otherwise.

export type ManufacturerPalette = {
  light: string;
  dark: string;
};

// Keyed by MA's 3-letter make code as emitted in _res.pdf filenames.
const PALETTE: Record<string, ManufacturerPalette> = {
  // MotoGP regulars — hex pulled directly from MotoGP.com's manufacturer stripe.
  APR: { light: '#5F259F', dark: '#B98AE8' },  // Aprilia purple
  KTM: { light: '#FF7E27', dark: '#FF9547' },  // KTM orange
  DUC: { light: '#AD0000', dark: '#FF4747' },  // Ducati red
  YAM: { light: '#0A2D82', dark: '#4A7AD8' },  // Yamaha navy
  HON: { light: '#E50000', dark: '#FF4747' },  // Honda red

  // MotoAmerica support-paddock manufacturers — brand-palette picks.
  BMW: { light: '#1C69D4', dark: '#5D9EFF' },  // BMW motorsport blue
  SUZ: { light: '#003B71', dark: '#4A85C8' },  // Suzuki corporate blue
  KAW: { light: '#40A71F', dark: '#5FD93C' },  // Kawasaki green
  TRI: { light: '#1B1B1F', dark: '#9A9AA0' },  // Triumph near-black → mid grey on dark
  MVA: { light: '#C10016', dark: '#FF4747' },  // MV Agusta red
  BEN: { light: '#0E9F8C', dark: '#3ED6C2' },  // Benelli teal
  REB: { light: '#D14C1E', dark: '#FF8A54' },  // Royal Enfield "bullet" orange
  IND: { light: '#8B1313', dark: '#E85252' },  // Indian Motorcycle
  HRD: { light: '#1B1B1F', dark: '#C8C8CC' },  // Harley-Davidson (KOTB)
  HDS: { light: '#1B1B1F', dark: '#C8C8CC' },  // Harley-Davidson sibling code
};

// Privateer / unknown manufacturer stripe. Neutral grey in both themes.
const PRIVATEER: ManufacturerPalette = { light: '#9A9AA0', dark: '#5A5A60' };

export function manufacturerColor(
  makeCode: string | null | undefined,
  theme: 'light' | 'dark',
): string {
  if (!makeCode) return theme === 'dark' ? PRIVATEER.dark : PRIVATEER.light;
  const key = makeCode.toUpperCase();
  const entry = PALETTE[key] ?? PRIVATEER;
  return theme === 'dark' ? entry.dark : entry.light;
}

export function hasKnownManufacturerColor(makeCode: string | null | undefined): boolean {
  if (!makeCode) return false;
  return PALETTE[makeCode.toUpperCase()] != null;
}
