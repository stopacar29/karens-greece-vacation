import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { FAMILIES } from '../constants/families';
import type { TripData, FlightInfo, DaySchedule, ActivityItem } from '../types/trip';
import { defaultTripData, normalizeFlight, normalizeActivity } from '../types/trip';

const STORAGE_KEY = 'karens_greece_trip';
const TRIP_API = '/api/trip';
const ids = FAMILIES.map((f) => f.id);
const idsWithAll = ['all', ...ids];
const SAVE_DEBOUNCE_MS = 1200;

function emptyFlights(): Record<string, FlightInfo[]> {
  return Object.fromEntries(
    ids.map((id) => [id, [{ departureDate: '', airline: '', flightNumber: '', departureAirport: '', departureTime: '', arrivalAirport: '', arrivalTime: '' }]])
  );
}

function emptyFlightDates() {
  return Object.fromEntries(ids.map((id) => [id, { departure: '', return: '' }]));
}

function emptyPerFamily(): Record<string, string> {
  return Object.fromEntries(ids.map((id) => [id, '']));
}

function emptyPerFamilyWithAll(): Record<string, string> {
  return Object.fromEntries(idsWithAll.map((id) => [id, '']));
}

function emptyTransfers() {
  return Object.fromEntries(ids.map((id) => [id, { toAirport: '', fromAirport: '' }]));
}

const defaultData: TripData = {
  ...defaultTripData(ids),
  families: FAMILIES,
};

/** Merge parsed (from API or localStorage) into existing state; used for load. */
function mergeParsedIntoState(prev: TripData, parsed: Partial<TripData>): TripData {
  return {
    families: parsed.families?.length ? parsed.families : prev.families,
    tripStartDate: parsed.tripStartDate ?? prev.tripStartDate,
    tripEndDate: parsed.tripEndDate ?? prev.tripEndDate,
    flights: (() => {
      const base = emptyFlights();
      if (!parsed.flights || typeof parsed.flights !== 'object') return { ...base, ...prev.flights };
      const out = { ...base };
      for (const id of ids) {
        const raw = (parsed.flights as Record<string, unknown>)[id];
        if (Array.isArray(raw) && raw.length > 0) {
          out[id] = raw.slice(0, 5).map((f) => normalizeFlight(f));
        } else if (raw != null) {
          out[id] = [normalizeFlight(raw)];
        } else if (prev.flights[id]) {
          out[id] = prev.flights[id];
        }
      }
      return out;
    })(),
    flightDates: { ...emptyFlightDates(), ...prev.flightDates, ...parsed.flightDates },
    accommodation: { ...emptyPerFamily(), ...prev.accommodation, ...parsed.accommodation },
    accommodationSantorini: { ...emptyPerFamilyWithAll(), ...prev.accommodationSantorini, ...parsed.accommodationSantorini },
    accommodationCrete: { ...emptyPerFamilyWithAll(), ...prev.accommodationCrete, ...parsed.accommodationCrete },
    accommodationSantoriniCheckIn: { ...emptyPerFamilyWithAll(), ...prev.accommodationSantoriniCheckIn, ...(parsed.accommodationSantoriniCheckIn ?? {}) },
    accommodationCreteCheckIn: { ...emptyPerFamilyWithAll(), ...prev.accommodationCreteCheckIn, ...(parsed.accommodationCreteCheckIn ?? {}) },
    activities: (() => {
      const base = Object.fromEntries(idsWithAll.map((id) => [id, [] as ActivityItem[]]));
      if (!parsed.activities || typeof parsed.activities !== 'object') return { ...base, ...prev.activities };
      const out = { ...base };
      for (const id of idsWithAll) {
        const raw = (parsed.activities as Record<string, unknown>)[id];
        if (Array.isArray(raw)) {
          out[id] = raw.map((a) => normalizeActivity(a));
        } else if (prev.activities[id]) {
          out[id] = prev.activities[id];
        }
      }
      return out;
    })(),
    transfers: { ...emptyTransfers(), ...prev.transfers, ...parsed.transfers },
    schedule: Array.isArray(parsed.schedule) && parsed.schedule.length > 0 ? parsed.schedule : prev.schedule,
    scheduleByDay: typeof parsed.scheduleByDay === 'object' ? { ...prev.scheduleByDay, ...parsed.scheduleByDay } : prev.scheduleByDay,
    dayItems: typeof parsed.dayItems === 'object' ? { ...prev.dayItems, ...parsed.dayItems } : prev.dayItems,
    gettingAround: parsed.gettingAround !== undefined ? parsed.gettingAround : prev.gettingAround,
    importantNumbers: parsed.importantNumbers !== undefined ? parsed.importantNumbers : prev.importantNumbers,
  };
}

type TripContextValue = {
  tripData: TripData;
  updateTrip: (partial: Partial<TripData>) => void;
  updateDaySchedule: (date: string, daySchedule: DaySchedule) => void;
  mergeFromImport: (partial: Partial<TripData>) => void;
  /** Push current data to the server now (for "Sync to server"). */
  saveToServer: () => Promise<{ ok: boolean; error?: string }>;
  /** Refetch from server and replace local state (for "Load from server"). */
  loadFromServer: () => Promise<{ ok: boolean; error?: string }>;
};

const TripContext = createContext<TripContextValue | null>(null);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [tripData, setTripData] = useState<TripData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData;
      const parsed = JSON.parse(raw) as Partial<TripData>;
      return mergeParsedIntoState(defaultData, parsed);
    } catch {
      return defaultData;
    }
  });

  // Persist to localStorage (works offline / backup)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tripData));
  }, [tripData]);

  // Load from server automatically on first use and every visit (so everyone sees the same data)
  useEffect(() => {
    let cancelled = false;
    fetch(TRIP_API)
      .then((res) => {
        if (cancelled || !res.ok) return null;
        return res.json();
      })
      .then((parsed) => {
        if (cancelled || parsed == null || parsed.message) return;
        if (typeof parsed !== 'object') return;
        setTripData((prev) => mergeParsedIntoState(prev, parsed as Partial<TripData>));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Save to server (debounced) so other family members see updates
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      fetch(TRIP_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData),
      }).catch(() => {});
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [tripData]);

  const updateTrip = useCallback((partial: Partial<TripData>) => {
    setTripData((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateDaySchedule = useCallback((date: string, daySchedule: DaySchedule) => {
    setTripData((prev) => ({
      ...prev,
      scheduleByDay: { ...prev.scheduleByDay, [date]: daySchedule },
    }));
  }, []);

  const mergeFromImport = useCallback((partial: Partial<TripData>) => {
    setTripData((prev) => {
      const next: TripData = {
        ...prev,
        tripStartDate: partial.tripStartDate ?? prev.tripStartDate,
        tripEndDate: partial.tripEndDate ?? prev.tripEndDate,
        flights: (() => {
          const next = { ...prev.flights };
          const from = partial.flights ?? {};
          for (const id of Object.keys(from)) {
            const v = from[id];
            next[id] = Array.isArray(v) ? v.slice(0, 5).map(normalizeFlight) : [normalizeFlight(v)];
          }
          return next;
        })(),
        accommodationSantorini: { ...prev.accommodationSantorini, ...(partial.accommodationSantorini ?? {}) },
        accommodationCrete: { ...prev.accommodationCrete, ...(partial.accommodationCrete ?? {}) },
        accommodationSantoriniCheckIn: { ...prev.accommodationSantoriniCheckIn, ...(partial.accommodationSantoriniCheckIn ?? {}) },
        accommodationCreteCheckIn: { ...prev.accommodationCreteCheckIn, ...(partial.accommodationCreteCheckIn ?? {}) },
        activities: { ...prev.activities, ...(partial.activities ?? {}) },
        transfers: { ...prev.transfers, ...(partial.transfers ?? {}) },
        schedule: partial.schedule?.length ? partial.schedule : prev.schedule,
        scheduleByDay: { ...prev.scheduleByDay, ...(partial.scheduleByDay ?? {}) },
        dayItems: { ...prev.dayItems, ...(partial.dayItems ?? {}) },
        gettingAround: partial.gettingAround !== undefined ? partial.gettingAround : prev.gettingAround,
        importantNumbers: partial.importantNumbers !== undefined ? partial.importantNumbers : prev.importantNumbers,
      };
      return next;
    });
  }, []);

  const tripDataRef = useRef(tripData);
  tripDataRef.current = tripData;

  const saveToServer = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(TRIP_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripDataRef.current),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: (err as { error?: string }).error || res.statusText };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
    }
  }, []);

  const loadFromServer = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(TRIP_API);
      if (!res.ok) return { ok: false, error: res.status === 404 ? 'No data on server yet' : res.statusText };
      const parsed = await res.json();
      if (parsed && typeof parsed === 'object' && !('message' in parsed && parsed.message)) {
        setTripData((prev) => mergeParsedIntoState(prev, parsed as Partial<TripData>));
        return { ok: true };
      }
      return { ok: false, error: 'Invalid response' };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
    }
  }, []);

  return (
    <TripContext.Provider value={{ tripData, updateTrip, updateDaySchedule, mergeFromImport, saveToServer, loadFromServer }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used within TripProvider');
  return ctx;
}
