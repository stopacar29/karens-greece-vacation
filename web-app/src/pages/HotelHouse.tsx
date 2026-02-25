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

  const getSantoriniEntries = (familyId: string): AccommodationEntry[] => {
    const raw = tripData.accommodationSantorini?.[familyId];
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return [emptyEntry()];
  };

  const getCreteEntries = (familyId: string): AccommodationEntry[] => {
    const raw = tripData.accommodationCrete?.[familyId];
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return [emptyEntry()];
  };

  const setSantoriniEntries = (familyId: string, entries: AccommodationEntry[]) => {
    updateTrip({ accommodationSantorini: { ...tripData.accommodationSantorini, [familyId]: entries } });
  };

  const setCreteEntries = (familyId: string, entries: AccommodationEntry[]) => {
    updateTrip({ accommodationCrete: { ...tripData.accommodationCrete, [familyId]: entries } });
  };

  const updateSantoriniEntry = (familyId: string, index: number, field: keyof AccommodationEntry, value: string) => {
    const list = getSantoriniEntries(familyId);
    const updated = [...list];
    if (!updated[index]) updated[index] = emptyEntry();
    updated[index] = { ...updated[index], [field]: value };
    setSantoriniEntries(familyId, updated);
  };

  const updateCreteEntry = (familyId: string, index: number, field: keyof AccommodationEntry, value: string) => {
    const list = getCreteEntries(familyId);
    const updated = [...list];
    if (!updated[index]) updated[index] = emptyEntry();
    updated[index] = { ...updated[index], [field]: value };
    setCreteEntries(familyId, updated);
  };

  const addNextSantorini = (familyId: string) => {
    const list = getSantoriniEntries(familyId);
    if (list.length >= MAX_ACCOMMODATIONS_PER_FAMILY) return;
    setSantoriniEntries(familyId, [...list, emptyEntry()]);
  };

  const addNextCrete = (familyId: string) => {
    const list = getCreteEntries(familyId);
    if (list.length >= MAX_ACCOMMODATIONS_PER_FAMILY) return;
    setCreteEntries(familyId, [...list, emptyEntry()]);
  };

  const removeSantorini = (familyId: string, index: number) => {
    const list = getSantoriniEntries(familyId).filter((_, i) => i !== index);
    setSantoriniEntries(familyId, list.length ? list : [emptyEntry()]);
  };

  const removeCrete = (familyId: string, index: number) => {
    const list = getCreteEntries(familyId).filter((_, i) => i !== index);
    setCreteEntries(familyId, list.length ? list : [emptyEntry()]);
  };

  return (
    <div className="card">
      <h2 className="sectionLabel">Hotel / House</h2>
      <p className="hint">Check-in dates and details for Santorini and Crete. Add up to {MAX_ACCOMMODATIONS_PER_FAMILY} per family per island. First option &quot;All&quot; applies to everyone. Entries appear on the Schedule page on that date.</p>

      <section style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, color: '#1a4d6d', margin: '0 0 12px 0', fontWeight: 600 }}>Santorini</h3>
        {allFamilyList.map((family) => {
          const entries = getSantoriniEntries(family.id);
          return (
            <div key={`santorini-${family.id}`} style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 14, color: '#5c5c5c', margin: '0 0 10px 0' }}>{family.name}</h4>
              {entries.map((entry, index) => (
                <div key={index} style={{ marginBottom: 16, padding: '12px 0', borderBottom: index < entries.length - 1 ? '1px solid #eee' : 'none' }}>
                  {entries.length > 1 && <span style={{ fontSize: 13, color: '#5c5c5c', marginBottom: 8, display: 'block' }}>Accommodation {index + 1}</span>}
                  <div className="inputRow">
                    <MonthDaySelect
                      label="Check-in date"
                      value={entry.checkIn}
                      onChange={(v) => updateSantoriniEntry(family.id, index, 'checkIn', v)}
                    />
                  </div>
                  <div className="inputRow">
                    <label>Hotel/villa details</label>
                    <textarea
                      value={entry.details}
                      onChange={(e) => updateSantoriniEntry(family.id, index, 'details', e.target.value)}
                      placeholder="Hotel/villa name, check-in & out"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    {index === entries.length - 1 && entries.length < MAX_ACCOMMODATIONS_PER_FAMILY && (
                      <button type="button" className="btn btnSecondary" onClick={() => addNextSantorini(family.id)}>
                        Next Hotel / House
                      </button>
                    )}
                    <button type="button" className="secondary" onClick={() => removeSantorini(family.id, index)} style={{ color: '#a00' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </section>

      <section>
        <h3 style={{ fontSize: 16, color: '#1a4d6d', margin: '0 0 12px 0', fontWeight: 600 }}>Crete</h3>
        {allFamilyList.map((family) => {
          const entries = getCreteEntries(family.id);
          return (
            <div key={`crete-${family.id}`} style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 14, color: '#5c5c5c', margin: '0 0 10px 0' }}>{family.name}</h4>
              {entries.map((entry, index) => (
                <div key={index} style={{ marginBottom: 16, padding: '12px 0', borderBottom: index < entries.length - 1 ? '1px solid #eee' : 'none' }}>
                  {entries.length > 1 && <span style={{ fontSize: 13, color: '#5c5c5c', marginBottom: 8, display: 'block' }}>Accommodation {index + 1}</span>}
                  <div className="inputRow">
                    <MonthDaySelect
                      label="Check-in date"
                      value={entry.checkIn}
                      onChange={(v) => updateCreteEntry(family.id, index, 'checkIn', v)}
                    />
                  </div>
                  <div className="inputRow">
                    <label>Hotel/villa details</label>
                    <textarea
                      value={entry.details}
                      onChange={(e) => updateCreteEntry(family.id, index, 'details', e.target.value)}
                      placeholder="Hotel/villa name, check-in & out"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    {index === entries.length - 1 && entries.length < MAX_ACCOMMODATIONS_PER_FAMILY && (
                      <button type="button" className="btn btnSecondary" onClick={() => addNextCrete(family.id)}>
                        Next Hotel / House
                      </button>
                    )}
                    <button type="button" className="secondary" onClick={() => removeCrete(family.id, index)} style={{ color: '#a00' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </section>
    </div>
  );
}
