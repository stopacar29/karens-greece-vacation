import type { Family } from '../constants/families';

export type ScheduleEvent = { day: string; time: string; title: string; note: string };

export type FlightInfo = {
  departureDate: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalTime: string;
};

export type AirportTransfers = { toAirport: string; fromAirport: string };

/** One hotel/house entry (Santorini or Crete): check-in date and details. */
export type AccommodationEntry = { checkIn: string; details: string };

/** Activity entry from Travel page (Activity section). */
export type ActivityItem = {
  activity: string;
  date: string;
  time: string;
  dressCode: string;
  notes: string;
};

/** One activity on a specific day: family, description, time. */
export type DayItem = { familyId: string; activity: string; time: string };

export type DaySchedule = {
  location: string;
  groupEvents: ScheduleEvent[];
  familyEvents: Record<string, ScheduleEvent[]>;
};

export type TripData = {
  families?: Family[];
  tripStartDate: string;
  tripEndDate: string;
  /** Up to 5 flights per family. */
  flights: Record<string, FlightInfo[]>;
  flightDates: Record<string, { departure: string; return: string }>;
  accommodation: Record<string, string>;
  /** Per-family list of accommodations (check-in + details). Replaces old string + CheckIn records. */
  accommodationSantorini: Record<string, AccommodationEntry[]>;
  accommodationCrete: Record<string, AccommodationEntry[]>;
  /** Activities (dinners, tours, etc.) per family. Show on Schedule by date. */
  activities: Record<string, ActivityItem[]>;
  transfers: Record<string, AirportTransfers>;
  schedule: ScheduleEvent[];
  scheduleByDay: Record<string, DaySchedule>;
  /** Running list by day: key = "MM-DD", value = activities that day. */
  dayItems: Record<string, DayItem[]>;
  gettingAround: string;
  importantNumbers: string;
};

function emptyFlightInfo(): FlightInfo {
  return { departureDate: '', airline: '', flightNumber: '', departureAirport: '', departureTime: '', arrivalAirport: '', arrivalTime: '' };
}

function emptyPerFamily(ids: string[]): Record<string, string> {
  return Object.fromEntries(ids.map((id) => [id, '']));
}

function emptyAccommodationEntry(): AccommodationEntry {
  return { checkIn: '', details: '' };
}

function emptyTransfers(ids: string[]): Record<string, AirportTransfers> {
  return Object.fromEntries(ids.map((id) => [id, { toAirport: '', fromAirport: '' }]));
}

export const DEFAULT_SCHEDULE: ScheduleEvent[] = [
  { day: 'Arrival', time: '', title: 'Check-in & welcome', note: 'Relax, unpack, first dinner together' },
  { day: 'Birthday day', time: '', title: "Karen's 70th celebration", note: 'Party dinner & cake' },
  { day: 'Excursion', time: '', title: 'Island / activity day', note: 'Add your planned trip or boat day' },
  { day: 'Free day', time: '', title: 'Beach & free time', note: 'Optional group lunch' },
  { day: 'Departure', time: '', title: 'Check-out & goodbyes', note: 'Safe travels home' },
];

export function defaultTripData(familyIds: string[]): TripData {
  const idsWithAll = ['all', ...familyIds];
  return {
    families: undefined,
    tripStartDate: '07/09',
    tripEndDate: '08/08',
    flights: Object.fromEntries(familyIds.map((id) => [id, [emptyFlightInfo()]])),
    flightDates: Object.fromEntries(familyIds.map((id) => [id, { departure: '', return: '' }])),
    accommodation: emptyPerFamily(familyIds),
    accommodationSantorini: Object.fromEntries(idsWithAll.map((id) => [id, [emptyAccommodationEntry()]])),
    accommodationCrete: Object.fromEntries(idsWithAll.map((id) => [id, [emptyAccommodationEntry()]])),
    activities: Object.fromEntries(idsWithAll.map((id) => [id, []])),
    transfers: emptyTransfers(familyIds),
    schedule: DEFAULT_SCHEDULE,
    scheduleByDay: {},
    dayItems: {},
    gettingAround: '',
    importantNumbers: '',
  };
}

export function normalizeFlight(v: unknown): FlightInfo {
  const e = emptyFlightInfo();
  if (typeof v === 'string') return { ...e, airline: v };
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return {
      departureDate: typeof o.departureDate === 'string' ? o.departureDate : e.departureDate,
      airline: typeof o.airline === 'string' ? o.airline : e.airline,
      flightNumber: typeof o.flightNumber === 'string' ? o.flightNumber : e.flightNumber,
      departureAirport: typeof o.departureAirport === 'string' ? o.departureAirport : e.departureAirport,
      departureTime: typeof o.departureTime === 'string' ? o.departureTime : e.departureTime,
      arrivalAirport: typeof o.arrivalAirport === 'string' ? o.arrivalAirport : e.arrivalAirport,
      arrivalTime: typeof o.arrivalTime === 'string' ? o.arrivalTime : e.arrivalTime,
    };
  }
  return e;
}

export const MAX_FLIGHTS_PER_FAMILY = 5;

export const MAX_ACCOMMODATIONS_PER_FAMILY = 5;

export function normalizeAccommodationEntry(v: unknown): AccommodationEntry {
  const e = emptyAccommodationEntry();
  if (!v || typeof v !== 'object') return e;
  const o = v as Record<string, unknown>;
  return {
    checkIn: typeof o.checkIn === 'string' ? o.checkIn : e.checkIn,
    details: typeof o.details === 'string' ? o.details : e.details,
  };
}

/** Convert parsed (old: Record<string, string> + CheckIn, or new: Record<string, AccommodationEntry[]>) to new shape. */
export function normalizeAccommodationSantorini(
  parsed: { accommodationSantorini?: Record<string, unknown>; accommodationSantoriniCheckIn?: Record<string, string> },
  familyIds: string[]
): Record<string, AccommodationEntry[]> {
  const out: Record<string, AccommodationEntry[]> = {};
  const raw = parsed.accommodationSantorini;
  const checkIns = parsed.accommodationSantoriniCheckIn ?? {};
  for (const id of familyIds) {
    const val = raw?.[id];
    if (Array.isArray(val) && val.length > 0) {
      out[id] = val.slice(0, MAX_ACCOMMODATIONS_PER_FAMILY).map(normalizeAccommodationEntry);
    } else if (typeof val === 'string') {
      out[id] = [{ checkIn: checkIns[id] ?? '', details: val }];
    } else {
      out[id] = [emptyAccommodationEntry()];
    }
  }
  return out;
}

export function normalizeAccommodationCrete(
  parsed: { accommodationCrete?: Record<string, unknown>; accommodationCreteCheckIn?: Record<string, string> },
  familyIds: string[]
): Record<string, AccommodationEntry[]> {
  const out: Record<string, AccommodationEntry[]> = {};
  const raw = parsed.accommodationCrete;
  const checkIns = parsed.accommodationCreteCheckIn ?? {};
  for (const id of familyIds) {
    const val = raw?.[id];
    if (Array.isArray(val) && val.length > 0) {
      out[id] = val.slice(0, MAX_ACCOMMODATIONS_PER_FAMILY).map(normalizeAccommodationEntry);
    } else if (typeof val === 'string') {
      out[id] = [{ checkIn: checkIns[id] ?? '', details: val }];
    } else {
      out[id] = [emptyAccommodationEntry()];
    }
  }
  return out;
}

export function emptyActivityItem(): ActivityItem {
  return { activity: '', date: '', time: '', dressCode: '', notes: '' };
}

export function normalizeActivity(v: unknown): ActivityItem {
  const e = emptyActivityItem();
  if (!v || typeof v !== 'object') return e;
  const o = v as Record<string, unknown>;
  return {
    activity: typeof o.activity === 'string' ? o.activity : e.activity,
    date: typeof o.date === 'string' ? o.date : e.date,
    time: typeof o.time === 'string' ? o.time : e.time,
    dressCode: typeof o.dressCode === 'string' ? o.dressCode : e.dressCode,
    notes: typeof o.notes === 'string' ? o.notes : e.notes,
  };
}
