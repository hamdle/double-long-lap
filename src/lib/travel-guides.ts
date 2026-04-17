export const TRAVEL_GUIDE_SLUGS = ["atlanta", "barber", "america"] as const;
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
};
