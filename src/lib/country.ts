// Country name → two-letter ISO code for flag emoji rendering. Covers the
// countries we've seen in MotoAmerica rider hometowns; extend as needed.
const NAME_TO_ISO: Record<string, string> = {
  "United States": "US",
  Canada: "CA",
  Mexico: "MX",
  Brazil: "BR",
  Argentina: "AR",
  Colombia: "CO",
  Venezuela: "VE",
  "United Kingdom": "GB",
  Ireland: "IE",
  France: "FR",
  Germany: "DE",
  Italy: "IT",
  Spain: "ES",
  Portugal: "PT",
  Netherlands: "NL",
  Belgium: "BE",
  Switzerland: "CH",
  Austria: "AT",
  Sweden: "SE",
  Norway: "NO",
  Denmark: "DK",
  Finland: "FI",
  Poland: "PL",
  "Czech Republic": "CZ",
  Czechia: "CZ",
  Slovakia: "SK",
  Hungary: "HU",
  Romania: "RO",
  Greece: "GR",
  Turkey: "TR",
  "South Africa": "ZA",
  Australia: "AU",
  "New Zealand": "NZ",
  Japan: "JP",
  "South Korea": "KR",
  China: "CN",
  Thailand: "TH",
  Malaysia: "MY",
  Indonesia: "ID",
  Philippines: "PH",
  India: "IN",
};

export function countryToIso(country: string | null | undefined): string | null {
  if (!country) return null;
  return NAME_TO_ISO[country] ?? null;
}

// Turn an ISO 3166-1 alpha-2 country code into its flag emoji via regional
// indicator symbols. Falls back to null if the code isn't exactly two letters.
export function flagEmoji(country: string | null | undefined): string | null {
  const iso = countryToIso(country);
  if (!iso || iso.length !== 2) return null;
  const A = 0x1f1e6;
  const a = "A".charCodeAt(0);
  const first = A + (iso.charCodeAt(0) - a);
  const second = A + (iso.charCodeAt(1) - a);
  return String.fromCodePoint(first, second);
}
