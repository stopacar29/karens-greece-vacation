import { useTrip } from '../context/TripContext';
import { FAMILIES } from '../constants/families';
import type { FlightInfo } from '../types/trip';
import { normalizeFlight, MAX_FLIGHTS_PER_FAMILY } from '../types/trip';
import MonthDaySelect from '../components/MonthDaySelect';

function emptyFlight(): FlightInfo {
  return { departureDate: '', airline: '', flightNumber: '', departureAirport: '', departureTime: '', arrivalAirport: '', arrivalTime: '' };
}

export default function Flights() {
  const { tripData, updateTrip } = useTrip();
  const familyList = tripData.families?.length ? tripData.families : FAMILIES;

  const getFlightsForFamily = (familyId: string): FlightInfo[] => {
    const raw = tripData.flights[familyId];
    if (Array.isArray(raw) && raw.length > 0) return raw.map((f) => normalizeFlight(f));
    return [emptyFlight()];
  };

  const setFlightsForFamily = (familyId: string, flights: FlightInfo[]) => {
    updateTrip({ flights: { ...tripData.flights, [familyId]: flights } });
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

  return (
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
                {flights.length > 1 && <span style={{ fontSize: 13, color: '#5c5c5c', marginBottom: 8, display: 'block' }}>Flight {index + 1}</span>}
                <div className="inputRow">
                  <MonthDaySelect label="Departure date" value={fl.departureDate} onChange={(v) => updateFlight(family.id, index, 'departureDate', v)} />
                </div>
                <div className="inputRow">
                  <label>Airline</label>
                  <input value={fl.airline} onChange={(e) => updateFlight(family.id, index, 'airline', e.target.value)} placeholder="e.g. Delta" />
                </div>
                <div className="inputRow">
                  <label>Flight number</label>
                  <input value={fl.flightNumber} onChange={(e) => updateFlight(family.id, index, 'flightNumber', e.target.value)} placeholder="e.g. 123" />
                </div>
                <div className="inputRow">
                  <label>Departure Airport</label>
                  <input value={fl.departureAirport} onChange={(e) => updateFlight(family.id, index, 'departureAirport', e.target.value.toUpperCase().slice(0, 3))} placeholder="e.g. JFK" />
                </div>
                <div className="inputRow">
                  <label>Departure time</label>
                  <input value={fl.departureTime} onChange={(e) => updateFlight(family.id, index, 'departureTime', e.target.value)} placeholder="e.g. 10:00 AM" />
                </div>
                <div className="inputRow">
                  <label>Arrival airport</label>
                  <input value={fl.arrivalAirport} onChange={(e) => updateFlight(family.id, index, 'arrivalAirport', e.target.value.toUpperCase().slice(0, 3))} placeholder="e.g. ATH" />
                </div>
                <div className="inputRow">
                  <label>Arrival time</label>
                  <input value={fl.arrivalTime} onChange={(e) => updateFlight(family.id, index, 'arrivalTime', e.target.value)} placeholder="e.g. 10:00 AM" />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  {index === flights.length - 1 && flights.length < MAX_FLIGHTS_PER_FAMILY && (
                    <button type="button" className="btn btnSecondary" onClick={() => addNextFlight(family.id)}>Next Flight</button>
                  )}
                  <button type="button" className="secondary" onClick={() => removeFlight(family.id, index)} style={{ color: '#a00' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
