import { FAMILIES } from '@/constants/Families';
import type { TripData } from '@/types/trip';

/**
 * Simple heuristic parser for imported text/HTML: extract dates (YYYY-MM-DD),
 * family names, and flight-like blocks into partial TripData.
 */
export function parseImportedText(text: string): Partial<TripData> {
  const partial: Partial<TripData> = {};
  const dateRe = /\b(20\d{2})-(\d{2})-(\d{2})\b/g;
  const dates: string[] = [];
  let m;
  while ((m = dateRe.exec(text)) !== null) dates.push(m[0]);
  if (dates.length >= 2) {
    const sorted = [...new Set(dates)].sort();
    partial.tripStartDate = sorted[0];
    partial.tripEndDate = sorted[sorted.length - 1];
  } else if (dates.length === 1) {
    partial.tripStartDate = dates[0];
    partial.tripEndDate = dates[0];
  }

  const familyIds = FAMILIES.map((f) => f.id);
  const familyNames = FAMILIES.map((f) => f.name);
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const flightBlocks: Record<string, string> = {};

  for (let i = 0; i < familyNames.length; i++) {
    const name = familyNames[i];
    const id = familyIds[i];
    const nameParts = name.split(/\s+and\s+/);
    for (const line of lines) {
      const lower = line.toLowerCase();
      const hasName = nameParts.some((p) => lower.includes(p.toLowerCase()));
      const hasFlight = /\bflight|depart|arriv|airline|airport\b/i.test(line);
      if (hasName && (hasFlight || line.length > 20)) {
        flightBlocks[id] = (flightBlocks[id] || '').concat(flightBlocks[id] ? '\n' : '', line).trim();
      }
    }
  }
  if (Object.keys(flightBlocks).length > 0) partial.flights = flightBlocks;

  return partial;
}
