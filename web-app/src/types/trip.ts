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
  /** Single list of accommodations per family (check-in + details). Replaces Santorini/Crete split. */
  accommodationList: Record<string, AccommodationEntry[]>;
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
    accommodationList: Object.fromEntries(idsWithAll.map((id) => [id, [emptyAccommodationEntry()]])),
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

export const MAX_ACCOMMODATIONS_PER_FAMILY = 10;

export function normalizeAccommodationEntry(v: unknown): AccommodationEntry {
  const e = emptyAccommodationEntry();
  if (!v || typeof v !== 'object') return e;
  const o = v as Record<string, unknown>;
  return {
    checkIn: typeof o.checkIn === 'string' ? o.checkIn : e.checkIn,
    details: typeof o.details === 'string' ? o.details : e.details,
  };
}

/** Build accommodationList from parsed: use accommodationList if present, else merge old accommodationSantorini + accommodationCrete. */
export function normalizeAccommodationList(
  parsed: {
    accommodationList?: Record<string, unknown>;
    accommodationSantorini?: Record<string, unknown>;
    accommodationCrete?: Record<string, unknown>;
    accommodationSantoriniCheckIn?: Record<string, string>;
    accommodationCreteCheckIn?: Record<string, string>;
  },
  familyIds: string[]
): Record<string, AccommodationEntry[]> {
  const out: Record<string, AccommodationEntry[]> = {};
  const list = parsed.accommodationList;
  const santorini = parsed.accommodationSantorini;
  const crete = parsed.accommodationCrete;
  const santoriniCheckIn = parsed.accommodationSantoriniCheckIn ?? {};
  const creteCheckIn = parsed.accommodationCreteCheckIn ?? {};

  for (const id of familyIds) {
    const listId = list && typeof list === 'object' ? list[id] : undefined;
    if (Array.isArray(listId) && listId.length > 0) {
      out[id] = (listId as AccommodationEntry[]).slice(0, MAX_ACCOMMODATIONS_PER_FAMILY).map(normalizeAccommodationEntry);
      continue;
    }
    const sVal = santorini?.[id];
    const cVal = crete?.[id];
    const sArr = Array.isArray(sVal) ? (sVal as AccommodationEntry[]).map(normalizeAccommodationEntry) : typeof sVal === 'string' ? [{ checkIn: santoriniCheckIn[id] ?? '', details: sVal }] : [];
    const cArr = Array.isArray(cVal) ? (cVal as AccommodationEntry[]).map(normalizeAccommodationEntry) : typeof cVal === 'string' ? [{ checkIn: creteCheckIn[id] ?? '', details: cVal }] : [];
    const merged = [...sArr, ...cArr].slice(0, MAX_ACCOMMODATIONS_PER_FAMILY);
    out[id] = merged.length ? merged : [emptyAccommodationEntry()];
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
