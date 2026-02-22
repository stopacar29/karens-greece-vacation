import { useTrip } from '../context/TripContext';
import { FAMILIES } from '../constants/families';
import type { ActivityItem } from '../types/trip';
import { normalizeActivity, emptyActivityItem } from '../types/trip';
import MonthDaySelect from '../components/MonthDaySelect';

const ALL_FAMILY = { id: 'all', name: 'All' } as const;

export default function Travel() {
  const { tripData, updateTrip } = useTrip();
  const familyList = tripData.families?.length ? tripData.families : FAMILIES;
  const allFamilyList = [ALL_FAMILY, ...familyList];

  const getActivitiesForFamily = (familyId: string): ActivityItem[] => {
    const raw = tripData.activities?.[familyId];
    if (Array.isArray(raw) && raw.length > 0) return raw.map((a) => normalizeActivity(a));
    return [];
  };

  const setActivitiesForFamily = (familyId: string, items: ActivityItem[]) => {
    updateTrip({ activities: { ...tripData.activities, [familyId]: items } });
  };

  const updateActivity = (familyId: string, index: number, field: keyof ActivityItem, value: string) => {
    const list = getActivitiesForFamily(familyId);
    const displayList = list.length ? list : [emptyActivityItem()];
    const updated = [...displayList];
    if (!updated[index]) updated[index] = emptyActivityItem();
    updated[index] = { ...updated[index], [field]: value };
    setActivitiesForFamily(familyId, updated);
  };

  const addActivity = (familyId: string) => {
    setActivitiesForFamily(familyId, [...getActivitiesForFamily(familyId), emptyActivityItem()]);
  };

  const removeActivity = (familyId: string, index: number) => {
    setActivitiesForFamily(familyId, getActivitiesForFamily(familyId).filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="card">
        <h2 className="sectionLabel">Activities</h2>
        <p className="hint">Dinners, tours, and other planned activities. First option &quot;All&quot; applies to everyone. They will appear on the Schedule by date.</p>
        {allFamilyList.map((family) => {
          const activities = getActivitiesForFamily(family.id);
          const displayList = activities.length ? activities : [emptyActivityItem()];
          return (
            <div key={family.id} style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 16, color: '#1a4d6d', margin: '0 0 12px 0' }}>{family.name}</h3>
              {displayList.map((act, index) => (
                <div key={index} style={{ marginBottom: 16, padding: '12px 0', borderBottom: index < displayList.length - 1 ? '1px solid #eee' : 'none' }}>
                  {displayList.length > 1 && (
                    <span style={{ fontSize: 13, color: '#5c5c5c', marginBottom: 8, display: 'block' }}>Activity {index + 1}</span>
                  )}
                  <div className="inputRow">
                    <label>Activity</label>
                    <input value={act.activity} onChange={(e) => updateActivity(family.id, index, 'activity', e.target.value)} placeholder="e.g. Birthday dinner" />
                  </div>
                  <div className="inputRow">
                    <MonthDaySelect label="Date" value={act.date} onChange={(v) => updateActivity(family.id, index, 'date', v)} />
                  </div>
                  <div className="inputRow">
                    <label>Time</label>
                    <input value={act.time} onChange={(e) => updateActivity(family.id, index, 'time', e.target.value)} placeholder="e.g. 7:00 PM" />
                  </div>
                  <div className="inputRow">
                    <label>Dress code</label>
                    <input value={act.dressCode} onChange={(e) => updateActivity(family.id, index, 'dressCode', e.target.value)} placeholder="e.g. Smart casual" />
                  </div>
                  <div className="inputRow">
                    <label>Notes</label>
                    <input value={act.notes} onChange={(e) => updateActivity(family.id, index, 'notes', e.target.value)} placeholder="Optional notes" />
                  </div>
                  <button type="button" className="secondary" onClick={() => removeActivity(family.id, index)} style={{ marginTop: 8, color: '#a00' }}>Delete</button>
                </div>
              ))}
              <button type="button" className="secondary" onClick={() => addActivity(family.id)} style={{ marginTop: 8 }}>Add activity</button>
            </div>
          );
        })}
      </div>
      <div className="card">
        <h2 className="sectionLabel">Transfers</h2>
        {familyList.map((family) => (
          <div key={family.id} style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, color: '#1a4d6d', margin: '0 0 4px 0' }}>{family.name}</h3>
            <div className="inputRow">
              <label>To airport</label>
              <input
                value={tripData.transfers[family.id]?.toAirport ?? ''}
                onChange={(e) => updateTrip({ transfers: { ...tripData.transfers, [family.id]: { ...tripData.transfers[family.id], toAirport: e.target.value } } })}
                placeholder="Pickup time, driver, confirmation #"
              />
            </div>
            <div className="inputRow">
              <label>From airport</label>
              <input
                value={tripData.transfers[family.id]?.fromAirport ?? ''}
                onChange={(e) => updateTrip({ transfers: { ...tripData.transfers, [family.id]: { ...tripData.transfers[family.id], fromAirport: e.target.value } } })}
                placeholder="Pickup point, driver"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="sectionLabel">Getting around</h2>
        <textarea value={tripData.gettingAround} onChange={(e) => updateTrip({ gettingAround: e.target.value })} placeholder="Car rentals, ferries, etc." rows={3} />
      </div>
      <div className="card">
        <h2 className="sectionLabel">Important numbers</h2>
        <textarea value={tripData.importantNumbers} onChange={(e) => updateTrip({ importantNumbers: e.target.value })} placeholder="Emergency, villa contacts, etc." rows={3} />
      </div>
    </>
  );
}
