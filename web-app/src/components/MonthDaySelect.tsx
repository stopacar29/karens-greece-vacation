/** Two dropdowns: month name and day (1–31). Value stored as "MM-DD". */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function monthDayToKey(month: number, day: number): string {
  if (!month || !day) return '';
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function keyToMonthDay(key: string): { month: number; day: number } {
  if (!key) return { month: 0, day: 0 };
  const parts = key.split(/[-/]/).map((s) => parseInt(s.trim(), 10));
  const mm = parts[0];
  const dd = parts[1];
  return { month: mm && mm >= 1 && mm <= 12 ? mm : 0, day: dd && dd >= 1 && dd <= 31 ? dd : 0 };
}

type Props = {
  value: string; // "MM-DD" or ""
  onChange: (value: string) => void;
  label?: string;
};

export default function MonthDaySelect({ value, onChange, label = 'Date' }: Props) {
  const { month, day } = keyToMonthDay(value);

  const setMonth = (m: number) => {
    if (m && day) onChange(monthDayToKey(m, day));
    else if (!m && !day) onChange('');
    else onChange(monthDayToKey(m || 1, day || 1));
  };
  const setDay = (d: number) => {
    if (month && d) onChange(monthDayToKey(month, d));
    else if (!month && !d) onChange('');
    else onChange(monthDayToKey(month || 1, d || 1));
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div className="inputRow" style={{ marginBottom: 0, flex: '1 1 120px' }}>
        <label>{label} — Month</label>
        <select
          value={month || ''}
          onChange={(e) => setMonth(parseInt(e.target.value, 10) || 0)}
          style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
        >
          <option value="">—</option>
          {MONTHS.map((name, i) => (
            <option key={name} value={i + 1}>{name}</option>
          ))}
        </select>
      </div>
      <div className="inputRow" style={{ marginBottom: 0, flex: '1 1 80px' }}>
        <label>Day</label>
        <select
          value={day || ''}
          onChange={(e) => setDay(parseInt(e.target.value, 10) || 0)}
          style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
        >
          <option value="">—</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
