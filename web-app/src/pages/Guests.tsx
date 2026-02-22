import { useTrip } from '../context/TripContext';

export default function Guests() {
  const { tripData } = useTrip();
  const familyList = tripData.families?.length ? tripData.families : [];

  return (
    <div className="card">
      <h2 className="sectionLabel">Guests</h2>
      <p className="hint">Who's coming on the trip.</p>
      {familyList.map((family) => (
        <div key={family.id} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, color: '#1a4d6d', margin: '0 0 8px 0' }}>{family.name}</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {family.members.map((m, i) => (
              <li key={i}>
                {m.name}
                {m.note && <span style={{ color: '#5c5c5c' }}> — {m.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
