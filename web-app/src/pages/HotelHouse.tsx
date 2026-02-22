import { useTrip } from '../context/TripContext';
import { FAMILIES } from '../constants/families';
import MonthDaySelect from '../components/MonthDaySelect';

const ALL_FAMILY = { id: 'all', name: 'All' } as const;

export default function HotelHouse() {
  const { tripData, updateTrip } = useTrip();
  const familyList = tripData.families?.length ? tripData.families : FAMILIES;
  const allFamilyList = [ALL_FAMILY, ...familyList];

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

  return (
    <>
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
    </>
  );
}
