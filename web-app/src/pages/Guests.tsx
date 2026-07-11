import { FAMILIES, TOTAL_TRAVELERS } from '../constants/families';

export default function Guests() {
  return (
    <div className="card">
      <h2 className="sectionLabel">Guests</h2>
      <p className="hint">Who&apos;s coming on the trip — all {TOTAL_TRAVELERS} of us.</p>
      {FAMILIES.map((family) => (
        <div key={family.id} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, color: '#1a4d6d', margin: '0 0 8px 0' }}>
            {family.name}
            <span style={{ fontSize: 13, color: '#5c5c5c', fontWeight: 400 }}> · {family.members.length} travelers</span>
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {family.members.map((m, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
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
