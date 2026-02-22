import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FAMILIES } from '@/constants/Families';
import type { TripData, DaySchedule, FlightInfo } from '@/types/trip';
import { DEFAULT_SCHEDULE, emptyDaySchedule, emptyFlightInfo } from '@/types/trip';

const STORAGE_KEY = '@karens_greece_trip';

function emptyTransfers() {
  return Object.fromEntries(
    FAMILIES.map((f) => [f.id, { toAirport: '', fromAirport: '' }])
  );
}

function emptyPerFamily() {
  return Object.fromEntries(FAMILIES.map((f) => [f.id, '']));
}

function emptyFlights(): Record<string, FlightInfo> {
  return Object.fromEntries(FAMILIES.map((f) => [f.id, emptyFlightInfo()]));
}

function emptyFlightDates(): Record<string, { departure: string; return: string }> {
  return Object.fromEntries(FAMILIES.map((f) => [f.id, { departure: '', return: '' }]));
}

function normalizeFlight(v: unknown): FlightInfo {
  const e = emptyFlightInfo();
  if (typeof v === 'string') return { ...e, airline: v };
  if (v && typeof v === 'object' && 'airline' in v)
    return { ...e, ...(v as Record<string, string>) };
  return e;
}

const defaultTripData: TripData = {
  families: FAMILIES,
  tripStartDate: '2026-07-09',
  tripEndDate: '2026-08-08',
  flights: emptyFlights(),
  flightDates: emptyFlightDates(),
  accommodation: emptyPerFamily(),
  accommodationSantorini: emptyPerFamily(),
  accommodationCrete: emptyPerFamily(),
  transfers: emptyTransfers(),
  schedule: DEFAULT_SCHEDULE,
  scheduleByDay: {},
  gettingAround: '',
  importantNumbers: '',
  importedImages: [],
};

type TripContextValue = {
  tripData: TripData;
  isLoading: boolean;
  setTripData: (data: TripData) => void;
  /** Merge partial data and persist (for manual edits and PDF import). */
  updateTrip: (partial: Partial<TripData>) => void;
  /** Update a single day's schedule (calendar). */
  updateDaySchedule: (date: string, daySchedule: DaySchedule) => void;
  mergeFromImport: (partial: Partial<TripData>) => void;
  refresh: () => Promise<void>;
};

const TripContext = createContext<TripContextValue | null>(null);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [tripData, setTripDataState] = useState<TripData>(defaultTripData);
  const [isLoading, setIsLoading] = useState(true);

  const persist = useCallback(async (data: TripData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save trip data', e);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TripData>;
        setTripDataState({
          families: parsed.families && parsed.families.length > 0 ? parsed.families : FAMILIES,
          tripStartDate: parsed.tripStartDate ?? '2026-07-09',
          tripEndDate: parsed.tripEndDate ?? '2026-08-08',
          flights: (() => {
          const base = emptyFlights();
          if (!parsed.flights || typeof parsed.flights !== 'object') return base;
          const out = { ...base };
          for (const id of Object.keys(out)) {
            if (id in parsed.flights) out[id] = normalizeFlight((parsed.flights as Record<string, unknown>)[id]);
          }
          return out;
        })(),
          flightDates: { ...emptyFlightDates(), ...(parsed.flightDates ?? {}) },
          accommodation: { ...emptyPerFamily(), ...parsed.accommodation },
          accommodationSantorini: { ...emptyPerFamily(), ...parsed.accommodationSantorini },
          accommodationCrete: { ...emptyPerFamily(), ...parsed.accommodationCrete },
          transfers: { ...emptyTransfers(), ...parsed.transfers },
          schedule: Array.isArray(parsed.schedule) && parsed.schedule.length > 0 ? parsed.schedule : DEFAULT_SCHEDULE,
          scheduleByDay: typeof parsed.scheduleByDay === 'object' ? parsed.scheduleByDay : {},
          gettingAround: parsed.gettingAround ?? '',
          importantNumbers: parsed.importantNumbers ?? '',
          importedImages: Array.isArray(parsed.importedImages) ? parsed.importedImages : [],
        });
      }
    } catch (e) {
      console.warn('Failed to load trip data', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setTripData = useCallback(
    (data: TripData) => {
      setTripDataState(data);
      persist(data);
    },
    [persist]
  );

  const updateTrip = useCallback(
    (partial: Partial<TripData>) => {
      setTripDataState((prev) => {
        const next: TripData = { ...prev, ...partial };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateDaySchedule = useCallback(
    (date: string, daySchedule: DaySchedule) => {
      setTripDataState((prev) => {
        const next: TripData = {
          ...prev,
          scheduleByDay: { ...prev.scheduleByDay, [date]: daySchedule },
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const mergeFromImport = useCallback(
    (partial: Partial<TripData>) => {
      setTripDataState((prev) => {
        const next: TripData = {
          families: partial.families ?? prev.families,
          tripStartDate: partial.tripStartDate ?? prev.tripStartDate,
          tripEndDate: partial.tripEndDate ?? prev.tripEndDate,
          flights: (() => {
          const next = { ...prev.flights };
          const from = partial.flights ?? {};
          for (const id of Object.keys(from)) {
            next[id] = normalizeFlight(from[id as keyof typeof from]);
          }
          return next;
        })(),
          flightDates: { ...prev.flightDates, ...(partial.flightDates ?? {}) },
          accommodation: { ...prev.accommodation, ...(partial.accommodation ?? {}) },
          accommodationSantorini: { ...prev.accommodationSantorini, ...(partial.accommodationSantorini ?? {}) },
          accommodationCrete: { ...prev.accommodationCrete, ...(partial.accommodationCrete ?? {}) },
          transfers: { ...prev.transfers, ...(partial.transfers ?? {}) },
          schedule: partial.schedule?.length ? partial.schedule : prev.schedule,
          scheduleByDay: { ...prev.scheduleByDay, ...(partial.scheduleByDay ?? {}) },
          gettingAround: partial.gettingAround !== undefined ? partial.gettingAround : prev.gettingAround,
          importantNumbers: partial.importantNumbers !== undefined ? partial.importantNumbers : prev.importantNumbers,
          importedImages: partial.importedImages !== undefined ? partial.importedImages : prev.importedImages,
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return (
    <TripContext.Provider
      value={{
        tripData,
        isLoading,
        setTripData,
        updateTrip,
        updateDaySchedule,
        mergeFromImport,
        refresh: load,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used within TripProvider');
  return ctx;
}

export { FAMILIES };
