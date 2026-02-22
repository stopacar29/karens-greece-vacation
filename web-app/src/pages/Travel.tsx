import { useTrip } from '../context/TripContext';
import { FAMILIES } from '../constants/families';
import type { FlightInfo, ActivityItem } from '../types/trip';
import { normalizeFlight, normalizeActivity, MAX_FLIGHTS_PER_FAMILY, emptyActivityItem } from '../types/trip';
import MonthDaySelect from '../components/MonthDaySelect';

function emptyFlight(): FlightInfo {
  return { departureDate: '', airline: '', flightNumber: '', departureAirport: '', departureTime: '', arrivalAirport: '', arrivalTime: '' };
}

const ALL_FAMILY = { id: 'all', name: 'All' } as const;

export default function Travel() {
  const { tripData, updateTrip } = useTrip();
  const familyList = tripData.families?.length ? tripData.families : FAMILIES;
  /** For hotels and activities: first option is "All". */
  const allFamilyList = [ALL_FAMILY, ...familyList];

  const getFlightsForFamily = (familyId: string): FlightInfo[] => {
    const raw = tripData.flights[familyId];
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((f) => normalizeFlight(f));
    }
    return [emptyFlight()];
  };

  const setFlightsForFamily = (familyId: string, flights: FlightInfo[]) => {
    updateTrip({
      flights: { ...tripData.flights, [familyId]: flights },
    });
  };

  const updateFlight = (familyId: string, index: number, field: keyof FlightInfo, value: string) => {
    const list = getFlightsForFamily(familyId);
    const updated = [...list];
    if (!updated[index]) updated[index] = emptyFlight();
    updated[index] = { ...updated[index], [field]: value };
    setFlightsForFamily(familyId, updated);
  };

  const addNextFlight = (familyId: string) => {
    const list = getFlightsForFamily(familyId);
    if (list.length >= MAX_FLIGHTS_PER_FAMILY) return;
    setFlightsForFamily(familyId, [...list, emptyFlight()]);
  };

  const removeFlight = (familyId: string, index: number) => {
    const list = getFlightsForFamily(familyId);
    const next = list.filter((_, i) => i !== index);
    setFlightsForFamily(familyId, next.length ? next : [emptyFlight()]);
  };

  const deleteHotelSantorini = (familyId: string) => {
    updateTrip({
      accommodationSantorini: { ...tripData.accommodationSantorini, [familyId]: '' },
      accommodationSantoriniCheckIn: { ...tripData.accommodationSantoriniCheckIn, [familyId]: '' },
    });
  };

  const deleteHotelCrete = (familyId: string) => {
    updateTrip({
      accommodationCrete: { ...tripData.accommodationCrete, [familyId]: '' },
      accommodationCreteCheckIn: { ...tripData.accommodationCreteCheckIn, [familyId]: '' },
    });
  };

  const removeActivity = (familyId: string, index: number) => {
    const list = getActivitiesForFamily(familyId);
    setActivitiesForFamily(familyId, list.filter((_, i) => i !== index));
  };

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
    const list = getActivitiesForFamily(familyId);
    setActivitiesForFamily(familyId, [...list, emptyActivityItem()]);
  };

  return (
    <>
      <div className="card">
        <h2 className="sectionLabel">Flights (by family)</h2>
        <p className="hint">Add up to {MAX_FLIGHTS_PER_FAMILY} flights per family. Use &quot;Next Flight&quot; to add another.</p>
        {familyList.map((family) => {
          const flights = getFlightsForFamily(family.id);
          return (
            <div key={family.id} style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 16, color: '#1a4d6d', margin: '0 0 12px 0' }}>{family.name}</h3>
              {flights.map((fl, index) => (
                <div key={index} style={{ marginBottom: 16, padding: '12px 0', borderBottom: index < flights.length - 1 ? '1px solid #eee' : 'none' }}>
                  {flights.length > 1 && (
                    <span style={{ fontSize: 13, color: '#5c5c5c', marginBottom: 8, display: 'block' }}>Flight {index + 1}</span>
                  )}
                  <div className="inputRow">
                    <MonthDaySelect
                      label="Departure date"
                      value={fl.departureDate}
                      onChange={(v) => updateFlight(family.id, index, 'departureDate', v)}
                    />
                  </div>
                  <div className="inputRow">
                    <label>Airline</label>
                    <input
                      value={fl.airline}
                      onChange={(e) => updateFlight(family.id, index, 'airline', e.target.value)}
                      placeholder="e.g. Delta"
                    />
                  </div>
                  <div className="inputRow">
                    <label>Flight number</label>
                    <input
                      value={fl.flightNumber}
                      onChange={(e) => updateFlight(family.id, index, 'flightNumber', e.target.value)}
                      placeholder="e.g. 123"
                    />
                  </div>
                  <div className="inputRow">
                    <label>Departure Airport</label>
                    <input
                      value={fl.departureAirport}
                      onChange={(e) => updateFlight(family.id, index, 'departureAirport', e.target.value.toUpperCase().slice(0, 3))}
                      placeholder="e.g. JFK"
                    />
                  </div>
                  <div className="inputRow">
                    <label>Departure time</label>
                    <input
                      value={fl.departureTime}
                      onChange={(e) => updateFlight(family.id, index, 'departureTime', e.target.value)}
                      placeholder="e.g. 10:00 AM"
                    />
                  </div>
                  <div className="inputRow">
                    <label>Arrival airport</label>
                    <input
                      value={fl.arrivalAirport}
                      onChange={(e) => updateFlight(family.id, index, 'arrivalAirport', e.target.value.toUpperCase().slice(0, 3))}
                      placeholder="e.g. ATH"
                    />
                  </div>
                  <div className="inputRow">
                    <label>Arrival time</label>
                    <input
                      value={fl.arrivalTime}
                      onChange={(e) => updateFlight(family.id, index, 'arrivalTime', e.target.value)}
                      placeholder="e.g. 10:00 AM"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    {index === flights.length - 1 && flights.length < MAX_FLIGHTS_PER_FAMILY && (
                      <button type="button" className="btn btnSecondary" onClick={() => addNextFlight(family.id)}>
                        Next Flight
                      </button>
                    )}
                    <button type="button" className="secondary" onClick={() => removeFlight(family.id, index)} style={{ color: '#a00' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="card">
        <h2 className="sectionLabel">Santorini accommodation</h2>
        <p className="hint">Check-in date and details. First option &quot;All&quot; applies to everyone. Entries appear on the Schedule page on that date.</p>
        {allFamilyList.map((family) => (
          <div key={family.id} style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, color: '#1a4d6d', margin: '0 0 8px 0' }}>{family.name}</h3>
            <div className="inputRow">
              <MonthDaySelect
                label="Check-in date"
                value={tripData.accommodationSantoriniCheckIn?.[family.id] ?? ''}
                onChange={(v) => updateTrip({ accommodationSantoriniCheckIn: { ...tripData.accommodationSantoriniCheckIn, [family.id]: v } })}
              />
            </div>
            <div className="inputRow">
              <label>Hotel/villa details</label>
              <textarea
                value={tripData.accommodationSantorini[family.id] ?? ''}
                onChange={(e) => updateTrip({ accommodationSantorini: { ...tripData.accommodationSantorini, [family.id]: e.target.value } })}
                placeholder="Hotel/villa name, check-in & out"
              />
            </div>
            <button type="button" className="secondary" onClick={() => deleteHotelSantorini(family.id)} style={{ marginTop: 8, color: '#a00' }}>
              Delete
            </button>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="sectionLabel">Crete accommodation</h2>
        <p className="hint">Check-in date and details. First option &quot;All&quot; applies to everyone. Entries appear on the Schedule page on that date.</p>
        {allFamilyList.map((family) => (
          <div key={family.id} style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, color: '#1a4d6d', margin: '0 0 8px 0' }}>{family.name}</h3>
            <div className="inputRow">
              <MonthDaySelect
                label="Check-in date"
                value={tripData.accommodationCreteCheckIn?.[family.id] ?? ''}
                onChange={(v) => updateTrip({ accommodationCreteCheckIn: { ...tripData.accommodationCreteCheckIn, [family.id]: v } })}
              />
            </div>
            <div className="inputRow">
              <label>Hotel/villa details</label>
              <textarea
                value={tripData.accommodationCrete[family.id] ?? ''}
                onChange={(e) => updateTrip({ accommodationCrete: { ...tripData.accommodationCrete, [family.id]: e.target.value } })}
                placeholder="Hotel/villa name, check-in & out"
              />
            </div>
            <button type="button" className="secondary" onClick={() => deleteHotelCrete(family.id)} style={{ marginTop: 8, color: '#a00' }}>
              Delete
            </button>
          </div>
        ))}
      </div>
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
                    <input
                      value={act.activity}
                      onChange={(e) => updateActivity(family.id, index, 'activity', e.target.value)}
                      placeholder="e.g. Birthday dinner"
                    />
                  </div>
                  <div className="inputRow">
                    <MonthDaySelect
                      label="Date"
                      value={act.date}
                      onChange={(v) => updateActivity(family.id, index, 'date', v)}
                    />
                  </div>
                  <div className="inputRow">
                    <label>Time</label>
                    <input
                      value={act.time}
                      onChange={(e) => updateActivity(family.id, index, 'time', e.target.value)}
                      placeholder="e.g. 7:00 PM"
                    />
                  </div>
                  <div className="inputRow">
                    <label>Dress code</label>
                    <input
                      value={act.dressCode}
                      onChange={(e) => updateActivity(family.id, index, 'dressCode', e.target.value)}
                      placeholder="e.g. Smart casual"
                    />
                  </div>
                  <div className="inputRow">
                    <label>Notes</label>
                    <input
                      value={act.notes}
                      onChange={(e) => updateActivity(family.id, index, 'notes', e.target.value)}
                      placeholder="Optional notes"
                    />
                  </div>
                  <button type="button" className="secondary" onClick={() => removeActivity(family.id, index)} style={{ marginTop: 8, color: '#a00' }}>
                    Delete
                  </button>
                </div>
              ))}
              <button type="button" className="secondary" onClick={() => addActivity(family.id)} style={{ marginTop: 8 }}>
                Add activity
              </button>
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
        <textarea
          value={tripData.gettingAround}
          onChange={(e) => updateTrip({ gettingAround: e.target.value })}
          placeholder="Car rentals, ferries, etc."
          rows={3}
        />
      </div>
      <div className="card">
        <h2 className="sectionLabel">Important numbers</h2>
        <textarea
          value={tripData.importantNumbers}
          onChange={(e) => updateTrip({ importantNumbers: e.target.value })}
          placeholder="Emergency, villa contacts, etc."
          rows={3}
        />
      </div>
    </>
  );
}
