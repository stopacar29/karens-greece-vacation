/** City names for the airport codes on this trip (and a few likely alternates). */
export const AIRPORT_CITIES: Record<string, string> = {
  DFW: 'Dallas',
  DSM: 'Des Moines',
  ATH: 'Athens',
  JTR: 'Santorini',
  SAN: 'Santorini', // used in some of our bookings for Santorini (officially JTR)
  CHQ: 'Chania, Crete',
  HER: 'Heraklion, Crete',
  LHR: 'London',
  LGW: 'London',
  IST: 'Istanbul',
  SAW: 'Istanbul',
  NAV: 'Cappadocia',
  ASR: 'Kayseri (Cappadocia)',
  ADB: 'Izmir (Ephesus)',
  VIE: 'Vienna',
  SZG: 'Salzburg',
};

/** "Athens (ATH)" for known codes, or just the code if we don't know the city. */
export function destinationLabel(code: string): string {
  const c = (code || '').toUpperCase().trim();
  if (!c) return '';
  const city = AIRPORT_CITIES[c];
  return city ? `${city} (${c})` : c;
}

/** Just the city name, or '' if unknown. */
export function cityForCode(code: string): string {
  return AIRPORT_CITIES[(code || '').toUpperCase().trim()] ?? '';
}
