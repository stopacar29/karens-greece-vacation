import type { Family } from '@/constants/Families';

/**
 * Schema for trip data: PDF import + manual entry.
 * Two main stays: Santorini and Crete. Schedule is per-day with group + per-family events.
 */
export type ScheduleEvent = {
  day: string;
  time: string;
  title: string;
  note: string;
};

export type AirportTransfers = {
  toAirport: string;
  fromAirport: string;
};

/** Location for a given day */
export type DayLocation = 'santorini' | 'crete' | 'travel' | '';

export type DaySchedule = {
  location: DayLocation;
  groupEvents: ScheduleEvent[];
  /** Per family: events that family is doing alone (before/after group time) */
  familyEvents: Record<string, ScheduleEvent[]>;
};

export type FlightDates = { departure: string; return: string };

export type FlightInfo = {
  airline: string;
  flightNumber: string;
  departureAirport: string; // 3-letter code
  departureTime: string;    // HH:MM AM or PM
  arrivalAirport: string;  // 3-letter code
  arrivalTime: string;     // HH:MM AM or PM
};

export function emptyFlightInfo(): FlightInfo {
  return {
    airline: '',
    flightNumber: '',
    departureAirport: '',
    departureTime: '',
    arrivalAirport: '',
    arrivalTime: '',
  };
}

/** Format for display in Schedule */
export function formatFlightInfo(f: FlightInfo): string {
  if (!f.airline && !f.flightNumber && !f.departureAirport && !f.arrivalAirport) return '';
  const parts = [
    [f.airline, f.flightNumber].filter(Boolean).join(' '),
    f.departureAirport && f.departureTime ? `${f.departureAirport} ${f.departureTime}` : f.departureAirport || f.departureTime,
    f.arrivalAirport && f.arrivalTime ? `${f.arrivalAirport} ${f.arrivalTime}` : f.arrivalAirport || f.arrivalTime,
  ].filter(Boolean);
  return parts.join(' → ');
}

export type TripData = {
  families?: Family[];
  /** Trip date range (YYYY-MM-DD) for calendar */
  tripStartDate: string;
  tripEndDate: string;
  flights: Record<string, FlightInfo>;
  /** Optional: so flights show on Schedule for that date (YYYY-MM-DD). */
  flightDates: Record<string, FlightDates>;
  /** Legacy single accommodation; prefer Santorini + Crete */
  accommodation: Record<string, string>;
  accommodationSantorini: Record<string, string>;
  accommodationCrete: Record<string, string>;
  transfers: Record<string, AirportTransfers>;
  schedule: ScheduleEvent[];
  /** Per-day schedule: key = YYYY-MM-DD. Source of truth for calendar. */
  scheduleByDay: Record<string, DaySchedule>;
  gettingAround: string;
  importantNumbers: string;
  /** Images imported from device (e.g. JPEG) — optional. */
  importedImages?: { name: string; base64: string }[];
};

export const DEFAULT_SCHEDULE: ScheduleEvent[] = [
  { day: 'Arrival', time: '', title: 'Check-in & welcome', note: 'Relax, unpack, first dinner together' },
  { day: 'Birthday day', time: '', title: "Karen's 70th celebration", note: 'Party dinner & cake' },
  { day: 'Excursion', time: '', title: 'Island / activity day', note: 'Add your planned trip or boat day' },
  { day: 'Free day', time: '', title: 'Beach & free time', note: 'Optional group lunch' },
  { day: 'Departure', time: '', title: 'Check-out & goodbyes', note: 'Safe travels home' },
];

export function emptyDaySchedule(): DaySchedule {
  return { location: '', groupEvents: [], familyEvents: {} };
}
