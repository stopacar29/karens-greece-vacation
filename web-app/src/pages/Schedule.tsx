import { useTrip } from '../context/TripContext';
import { FAMILIES } from '../constants/families';
import type { DayItem } from '../types/trip';
import { normalizeFlight } from '../types/trip';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Parse "07/09", "7/9", "July 9" etc. to { month, day } (1-based month). */
function parseMonthDay(s: string): { month: number; day: number } | null {
  if (!s?.trim()) return null;
  const t = s.trim();
  const slash = t.split('/').map((x) => x.trim()).filter(Boolean);
  if (slash.length >= 2) {
    const m = parseInt(slash[0], 10);
    const d = parseInt(slash[1], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { month: m, day: d };
  }
  for (let i = 0; i < MONTHS.length; i++) {
    if (t.toLowerCase().startsWith(MONTHS[i].toLowerCase())) {
      const rest = t.slice(MONTHS[i].length).replace(/,/g, '').trim();
      const d = parseInt(rest, 10);
      if (d >= 1 && d <= 31) return { month: i + 1, day: d };
    }
  }
  return null;
}

/** "MM-DD" for key. */
function toDateKey(month: number, day: number): string {
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** "July 15" for display. */
function toDisplayDate(key: string): string {
  const [mm, dd] = key.split('-').map(Number);
  if (!mm || !dd) return key;
  const monthName = MONTHS[mm - 1] || mm;
  return `${monthName} ${dd}`;
}

function normalizeToDateKey(s: string): string | null {
  const p = parseMonthDay(s.replace(/-/g, '/'));
  if (!p) return null;
  return toDateKey(p.month, p.day);
}

/** Collect all date keys that have data: flights, dayItems, accommodation check-ins, activities. */
function getAllDateKeys(tripData: {
  flights: Record<string, { departureDate?: string }[]>;
  dayItems: Record<string, unknown[]>;
  accommodationSantorini?: Record<string, { checkIn?: string }[]>;
  accommodationCrete?: Record<string, { checkIn?: string }[]>;
  activities?: Record<string, { date?: string }[]>;
}): string[] {
  const set = new Set<string>();
  Object.values(tripData.flights || {}).forEach((flights) => {
    flights.forEach((f) => {
      const key = normalizeToDateKey(f.departureDate || '');
      if (key) set.add(key);
    });
  });
  Object.keys(tripData.dayItems || {}).forEach((k) => {
    const key = normalizeToDateKey(k) || k;
    if (key) set.add(key);
  });
  Object.values(tripData.accommodationSantorini || {}).forEach((entries) => {
    (entries || []).forEach((e) => {
      const key = normalizeToDateKey(e.checkIn || '');
      if (key) set.add(key);
    });
  });
  Object.values(tripData.accommodationCrete || {}).forEach((entries) => {
    (entries || []).forEach((e) => {
      const key = normalizeToDateKey(e.checkIn || '');
      if (key) set.add(key);
    });
  });
  Object.values(tripData.activities || {}).forEach((list) => {
    (list || []).forEach((a) => {
      const key = normalizeToDateKey(a.date || '');
      if (key) set.add(key);
    });
  });
  return Array.from(set).sort();
}

export default function Schedule() {
  const { tripData, updateTrip } = useTrip();
  const familyList = tripData.families?.length ? tripData.families : FAMILIES;
  const dayItems = tripData.dayItems ?? {};

  const dateKeys = getAllDateKeys(tripData);

  /** Families plus "All" for accommodation and activities. */
  const familyListWithAll = [{ id: 'all', name: 'All' }, ...familyList];

  /** Activities for a day: manual dayItems + flights + accommodation check-ins + activities. */
  function getItemsForDay(dateKey: string): DayItem[] {
    const items: DayItem[] = [...(dayItems[dateKey] || [])];
    familyList.forEach((family) => {
      const flights = tripData.flights[family.id];
      if (Array.isArray(flights)) {
        flights.forEach((f) => {
          const fl = normalizeFlight(f);
          if (!fl.departureDate) return;
          const flightDateKey = normalizeToDateKey(fl.departureDate);
          if (flightDateKey === dateKey && (fl.airline || fl.flightNumber || fl.departureAirport || fl.arrivalAirport)) {
            const desc = [fl.airline, fl.flightNumber].filter(Boolean).join(' ') || 'Flight';
            const route = [fl.departureAirport, fl.arrivalAirport].filter(Boolean).join(' → ');
            items.push({
              familyId: family.id,
              activity: route ? `${desc} ${route}` : desc,
              time: fl.departureTime || '—',
            });
          }
        });
      }
    });
    familyListWithAll.forEach((family) => {
      const santoriniEntries = tripData.accommodationSantorini?.[family.id] || [];
      santoriniEntries.forEach((entry) => {
        if (normalizeToDateKey(entry.checkIn || '') === dateKey && (entry.details || '').trim()) {
          items.push({ familyId: family.id, activity: `Hotel (Santorini): ${entry.details.trim()}`, time: '' });
        }
      });
      const creteEntries = tripData.accommodationCrete?.[family.id] || [];
      creteEntries.forEach((entry) => {
        if (normalizeToDateKey(entry.checkIn || '') === dateKey && (entry.details || '').trim()) {
          items.push({ familyId: family.id, activity: `Hotel (Crete): ${entry.details.trim()}`, time: '' });
        }
      });
      const familyActivities = tripData.activities?.[family.id];
      if (Array.isArray(familyActivities)) {
        familyActivities.forEach((act) => {
          if (!act.activity?.trim()) return;
          const actDateKey = normalizeToDateKey(act.date || '');
          if (actDateKey === dateKey) {
            items.push({
              familyId: family.id,
              activity: act.activity.trim(),
              time: act.time?.trim() || '—',
            });
          }
        });
      }
    });
    items.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    return items;
  }

  const removeItem = (dateKey: string, index: number) => {
    const list = (dayItems[dateKey] || []).filter((_, i) => i !== index);
    updateTrip({ dayItems: { ...dayItems, [dateKey]: list } });
  };

  const getFamilyName = (familyId: string) => (familyId === 'all' ? 'All' : familyList.find((f) => f.id === familyId)?.name ?? familyId);

  return (
    <>
      <div className="card schedule-print-content">
        <h2 className="sectionLabel">Schedule by day</h2>
        <p className="hint">Flights, hotel check-ins, and activities from the Flights, Hotel / House, and Activities pages appear here when you set their dates.</p>
        <div className="no-print" style={{ marginBottom: 16 }}>
          <button type="button" className="btn btnPrimary" onClick={() => window.print()} aria-label="Print Schedule">
            Print Schedule
          </button>
        </div>
        {dateKeys.length === 0 ? (
          <p style={{ color: '#5c5c5c' }}>Add a departure date (Flights), a check-in date (Hotel / House), or an activity date (Activities), to see days here.</p>
        ) : (
          dateKeys.map((dateKey) => {
            const items = getItemsForDay(dateKey);
            const manualCount = (dayItems[dateKey] || []).length;
            return (
              <DayBlock
                key={dateKey}
                displayDate={toDisplayDate(dateKey)}
                items={items}
                manualCount={manualCount}
                getFamilyName={getFamilyName}
                onRemove={(index) => removeItem(dateKey, index)}
              />
            );
          })
        )}
      </div>
    </>
  );
}

function DayBlock({
  displayDate,
  items,
  manualCount,
  getFamilyName,
  onRemove,
}: {
  displayDate: string;
  items: DayItem[];
  manualCount: number;
  getFamilyName: (id: string) => string;
  onRemove: (index: number) => void;
}) {
  return (
    <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #eee' }}>
      <h3 style={{ fontSize: 18, color: '#1a4d6d', margin: '0 0 10px 0' }}>{displayDate}:</h3>
      {items.length === 0 ? (
        <p style={{ margin: '0 0 10px 0', color: '#5c5c5c', fontSize: 14 }}>No activities yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px 6px 0', color: '#5c5c5c', fontWeight: 600 }}>Family</th>
              <th style={{ padding: '6px 8px', color: '#5c5c5c', fontWeight: 600 }}>Activity</th>
              <th style={{ padding: '6px 0 6px 8px', color: '#5c5c5c', fontWeight: 600 }}>Time</th>
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px 8px 8px 0', verticalAlign: 'top' }}>{getFamilyName(item.familyId)}</td>
                <td style={{ padding: 8, verticalAlign: 'top' }}>{item.activity}</td>
                <td style={{ padding: '8px 0 8px 8px', verticalAlign: 'top' }}>{item.time || '—'}</td>
                <td style={{ padding: 8, verticalAlign: 'top' }}>
                  {index < manualCount && (
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      style={{ background: 'none', border: 'none', color: '#b71c1c', cursor: 'pointer', fontSize: 13 }}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
