import { useTrip } from '../context/TripContext';
import { FAMILIES } from '../constants/families';
import MonthDaySelect from '../components/MonthDaySelect';
import type { AccommodationEntry } from '../types/trip';
import { MAX_ACCOMMODATIONS_PER_FAMILY } from '../types/trip';

const ALL_FAMILY = { id: 'all', name: 'All' } as const;

function emptyEntry(): AccommodationEntry {
  return { checkIn: '', details: '' };
}

export default function HotelHouse() {
  const { tripData, updateTrip } = useTrip();
  const familyList = tripData.families?.length ? tripData.families : FAMILIES;
  const allFamilyList = [ALL_FAMILY, ...familyList];

  const getEntries = (familyId: string): AccommodationEntry[] => {
    const raw = tripData.accommodationList?.[familyId];
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return [emptyEntry()];
  };

  const setEntries = (familyId: string, entries: AccommodationEntry[]) => {
    updateTrip({ accommodationList: { ...tripData.accommodationList, [familyId]: entries } });
  };

  const updateEntry = (familyId: string, index: number, field: keyof AccommodationEntry, value: string) => {
    const list = getEntries(familyId);
    const updated = [...list];
    if (!updated[index]) updated[index] = emptyEntry();
    updated[index] = { ...updated[index], [field]: value };
    setEntries(familyId, updated);
  };

  const addNext = (familyId: string) => {
    const list = getEntries(familyId);
    if (list.length >= MAX_ACCOMMODATIONS_PER_FAMILY) return;
    setEntries(familyId, [...list, emptyEntry()]);
  };

  const removeEntry = (familyId: string, index: number) => {
    const list = getEntries(familyId).filter((_, i) => i !== index);
    setEntries(familyId, list.length ? list : [emptyEntry()]);
  };

  return (
    <div className="card">
      <h2 className="sectionLabel">Hotel / House</h2>
      <p className="hint">One entry area per family. Add up to {MAX_ACCOMMODATIONS_PER_FAMILY} accommodations per family. First option &quot;All&quot; applies to everyone. Entries appear on the Schedule page on the check-in date.</p>

      {allFamilyList.map((family) => {
        const entries = getEntries(family.id);
        return (
          <section key={family.id} style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #eee' }}>
            <h3 style={{ fontSize: 16, color: '#1a4d6d', margin: '0 0 12px 0', fontWeight: 600 }}>{family.name}</h3>
            {entries.map((entry, index) => (
              <div key={index} style={{ marginBottom: 16, padding: '12px 0', borderBottom: index < entries.length - 1 ? '1px solid #eee' : 'none' }}>
                {entries.length > 1 && <span style={{ fontSize: 13, color: '#5c5c5c', marginBottom: 8, display: 'block' }}>Accommodation {index + 1}</span>}
                <div className="inputRow">
                  <MonthDaySelect label="Check-in date" value={entry.checkIn} onChange={(v) => updateEntry(family.id, index, 'checkIn', v)} />
                </div>
                <div className="inputRow">
                  <label>Hotel/villa details</label>
                  <textarea
                    value={entry.details}
                    onChange={(e) => updateEntry(family.id, index, 'details', e.target.value)}
                    placeholder="Hotel/villa name, check-in & out"
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  {index === entries.length - 1 && entries.length < MAX_ACCOMMODATIONS_PER_FAMILY && (
                    <button type="button" className="btn btnSecondary" onClick={() => addNext(family.id)}>
                      Next Hotel / House
                    </button>
                  )}
                  <button type="button" className="secondary" onClick={() => removeEntry(family.id, index)} style={{ color: '#a00' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
