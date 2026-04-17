export const TRAVEL_GUIDE_SLUGS = [
  "daytona200",
  "atlanta",
  "barber",
  "america",
  "ridge",
  "laguna",
  "ohio",
  "vir",
  "cota",
  "newJersey",
] as const;
export type TravelGuideSlug = (typeof TRAVEL_GUIDE_SLUGS)[number];

export function hasTravelGuide(slug: string): slug is TravelGuideSlug {
  return (TRAVEL_GUIDE_SLUGS as readonly string[]).includes(slug);
}

type AffiliateLink = { label: string; href: string; vendor?: string };

export type TravelGuide = {
  title: string;
  subtitle: string;
  nearestAirports: string[];
  drivingNote?: string;
  hotelNote?: string;
  hotelLinks: AffiliateLink[];
  foodNote?: string;
  thingsToDo: string[];
  trackDayNote?: string;
  trackDayLinks: AffiliateLink[];
};

export const TRAVEL_GUIDES: Record<TravelGuideSlug, TravelGuide> = {
  daytona200: {
    title: "Daytona 200 — Travel Guide",
    subtitle:
      "Daytona International Speedway, Florida. The 200-mile Supersport classic, raced on the banked tri-oval infield course.",
    nearestAirports: [
      "Daytona Beach (DAB) — ~15 min drive",
      "Orlando (MCO) — ~70 min drive",
    ],
    drivingNote:
      "Easy I-95 or I-4 access. The Speedway is right off International Speedway Boulevard.",
    hotelNote:
      "Bike Week week-of bookings are a bad idea — book months out. Daytona Beach strip hotels sell out; consider Ormond Beach or Port Orange as overflow.",
    hotelLinks: [],
    thingsToDo: [
      "Daytona 200 experience and infield access",
      "Motorsports Hall of Fame of America (at the Speedway)",
      "Daytona Beach itself — drive on the sand",
    ],
    trackDayNote:
      "Daytona is a rare track day opportunity — when offered, spots disappear fast.",
    trackDayLinks: [],
  },
  atlanta: {
    title: "Road Atlanta — Travel Guide",
    subtitle: "Braselton, Georgia. Rolling hills, fast sweepers, and the Esses.",
    nearestAirports: ["Atlanta Hartsfield-Jackson (ATL) — ~70 min drive"],
    drivingNote:
      "I-85 north out of Atlanta is the standard route. Arrive Thursday to beat race-weekend traffic on I-985.",
    hotelNote:
      "Braselton and Gainesville both have cheaper chain hotels than downtown Atlanta and cut the commute.",
    hotelLinks: [],
    thingsToDo: [
      "Road Atlanta paddock walk (check schedule for open hours)",
      "Chateau Elan Winery (next door to the track)",
    ],
    trackDayNote:
      "Road Atlanta hosts track days through several orgs year-round. Book well in advance — this one fills up.",
    trackDayLinks: [],
  },
  barber: {
    title: "Barber Motorsports Park — Travel Guide",
    subtitle:
      "Birmingham, Alabama. The most photogenic track in North America, and home to the Barber Vintage Motorsports Museum.",
    nearestAirports: ["Birmingham-Shuttlesworth (BHM) — ~25 min drive"],
    drivingNote: "I-20 east from Birmingham; the park is signposted off exit 140.",
    hotelNote:
      "Stay in Leeds for closest to the track, or downtown Birmingham for food and nightlife (20 min drive).",
    hotelLinks: [],
    foodNote: "Saw's BBQ in Homewood is worth the detour on the way in or out.",
    thingsToDo: [
      "Barber Vintage Motorsports Museum (on site — largest motorcycle museum in the world)",
      "Sloss Furnaces National Historic Landmark",
    ],
    trackDayNote: "Barber hosts regular track days and multi-day schools.",
    trackDayLinks: [],
  },
  america: {
    title: "Road America — Travel Guide",
    subtitle:
      "Elkhart Lake, Wisconsin. Four miles of old-school circuit through the Kettle Moraine forest.",
    nearestAirports: [
      "Milwaukee Mitchell (MKE) — ~60 min drive",
      "Chicago O'Hare (ORD) — ~2h 45m drive",
    ],
    drivingNote: "I-43 north from Milwaukee; Elkhart Lake is signposted off WI-67.",
    hotelNote:
      "Book early — Elkhart Lake inns sell out months ahead for race weekends. Sheboygan is the overflow option.",
    hotelLinks: [],
    foodNote: "Siebkens Resort for classic Wisconsin; the bratwurst situation is taken seriously here.",
    thingsToDo: [
      "Walk Elkhart Lake's historic street-circuit route",
      "Kettle Moraine State Forest (northern unit) for hiking",
    ],
    trackDayNote: "Road America hosts regular track days with several organizations.",
    trackDayLinks: [],
  },
  ridge: {
    title: "Ridge Motorsports Park — Travel Guide",
    subtitle: "Shelton, Washington. Technical, elevation-heavy, and buried in Pacific Northwest forest.",
    nearestAirports: [
      "Seattle-Tacoma (SEA) — ~90 min drive",
      "Olympia Regional (OLM) — ~45 min drive",
    ],
    drivingNote:
      "US-101 along the Puget Sound is the scenic route; I-5 + WA-3 is faster.",
    hotelNote:
      "Shelton has limited hotel inventory. Olympia and Tacoma give you more options within a reasonable drive.",
    hotelLinks: [],
    thingsToDo: [
      "Olympic National Park day trip from Shelton",
      "Olympia's craft beer and food scene",
    ],
    trackDayNote: "Ridge runs regular track days — one of the best in the Northwest.",
    trackDayLinks: [],
  },
  laguna: {
    title: "Laguna Seca — Travel Guide",
    subtitle:
      "Monterey, California. The Corkscrew, ocean air, and one of the most iconic circuits in the world.",
    nearestAirports: [
      "Monterey Regional (MRY) — ~20 min drive",
      "San Jose (SJC) — ~90 min drive",
      "San Francisco (SFO) — ~2h drive",
    ],
    drivingNote:
      "Pacific Coast Highway (Highway 1) from the north is the iconic approach. Fog in the mornings is common.",
    hotelNote:
      "Monterey and Pacific Grove have charm and price. Salinas is cheaper but less scenic.",
    hotelLinks: [],
    foodNote: "Fisherman's Wharf and Cannery Row for the tourist experience; Carmel-by-the-Sea for dinner.",
    thingsToDo: [
      "17-Mile Drive along the Pebble Beach coastline",
      "Monterey Bay Aquarium",
      "Point Lobos State Reserve",
    ],
    trackDayNote: "Laguna Seca track days are rare and sell out in minutes. Set a calendar reminder.",
    trackDayLinks: [],
  },
  ohio: {
    title: "Mid-Ohio Sports Car Course — Travel Guide",
    subtitle:
      "Lexington, Ohio. Tight, technical, and lined with trees. Classic Midwest road course.",
    nearestAirports: [
      "Columbus (CMH) — ~80 min drive",
      "Cleveland (CLE) — ~90 min drive",
    ],
    drivingNote: "I-71 between Columbus and Cleveland; Lexington is a short detour off the interstate.",
    hotelNote: "Mansfield has chain hotels closest to the track. Columbus gives you more restaurants and nightlife.",
    hotelLinks: [],
    thingsToDo: [
      "Malabar Farm State Park",
      "Amish country in Holmes County (short drive east)",
    ],
    trackDayNote: "Mid-Ohio hosts track days through several orgs throughout the summer.",
    trackDayLinks: [],
  },
  vir: {
    title: "Virginia International Raceway — Travel Guide",
    subtitle:
      "Alton, Virginia. Long, flowing, and technical. A circuit that rewards smooth riding.",
    nearestAirports: [
      "Raleigh-Durham (RDU) — ~90 min drive",
      "Greensboro (GSO) — ~75 min drive",
    ],
    drivingNote:
      "The track is remote — budget extra time for the last leg. US-58 is the main approach.",
    hotelNote:
      "VIR has on-site lodging (villas, the Lodge). Off-site options are limited; Danville is the nearest town of size.",
    hotelLinks: [],
    thingsToDo: [
      "Tobacco Heritage Trail walking/cycling",
      "Danville Science Center",
    ],
    trackDayNote: "VIR hosts frequent track days on the full course, North course, and South course.",
    trackDayLinks: [],
  },
  cota: {
    title: "Circuit of The Americas — Travel Guide",
    subtitle:
      "Austin, Texas. Modern F1-grade facility with big elevation and a monumental Turn 1.",
    nearestAirports: ["Austin-Bergstrom (AUS) — ~25 min drive"],
    drivingNote: "Straight down TX-130 or TX-71 from Austin. Race-weekend traffic leaving the track is the pain point.",
    hotelNote:
      "Downtown Austin is 20-30 min away and your best bet for food and nightlife. South Austin and the area near the airport are cheaper.",
    hotelLinks: [],
    foodNote: "Franklin Barbecue is worth the line once; many other world-class BBQ spots have shorter waits.",
    thingsToDo: [
      "Austin's 6th Street and Rainey Street",
      "Barton Springs Pool",
      "Zilker Park",
    ],
    trackDayNote: "COTA hosts track days through a few partners; availability is limited.",
    trackDayLinks: [],
  },
  newJersey: {
    title: "New Jersey Motorsports Park — Travel Guide",
    subtitle:
      "Millville, New Jersey. Two circuits — Thunderbolt and Lightning — and the season finale venue.",
    nearestAirports: [
      "Philadelphia (PHL) — ~60 min drive",
      "Atlantic City (ACY) — ~40 min drive",
    ],
    drivingNote: "Atlantic City Expressway + NJ-55; the track is off NJ-552.",
    hotelNote:
      "Atlantic City casino hotels are affordable and 30-40 min from the track. Vineland has chain hotels closer.",
    hotelLinks: [],
    thingsToDo: [
      "Cape May historic district",
      "Atlantic City boardwalk",
      "Wharton State Forest hiking",
    ],
    trackDayNote: "NJMP runs regular track days on both Thunderbolt and Lightning.",
    trackDayLinks: [],
  },
};
