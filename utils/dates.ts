/** List of date strings YYYY-MM-DD from start (inclusive) to end (inclusive). */
export function datesBetween(start: string, end: string): string[] {
  if (!start || !end) return [];
  const s = new Date(start);
  const e = new Date(end);
  if (s.getTime() > e.getTime()) return [];
  const out: string[] = [];
  const d = new Date(s);
  while (d.getTime() <= e.getTime()) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Human-readable month + year (e.g. "July 2026"). month 1–12. */
export function getMonthYearLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** Cell for calendar grid: either a date (YYYY-MM-DD) or null for padding. 6 rows × 7 cols. */
export function getMonthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const firstWeekday = first.getDay();
  const lastDate = last.getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) {
    const yyyy = year;
    const mm = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push(`${yyyy}-${mm}-${dd}`);
  }
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) cells.push(null);
  }
  return cells;
}

/** True if date string is >= start and <= end. */
export function isDateInRange(dateStr: string, start: string, end: string): boolean {
  if (!start || !end) return false;
  return dateStr >= start && dateStr <= end;
}
