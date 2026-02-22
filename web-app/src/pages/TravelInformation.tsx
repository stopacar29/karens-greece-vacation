export default function TravelInformation() {
  return (
    <>
      <div className="card">
        <h2 className="sectionLabel">Tipping Policy</h2>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          In <strong>Santorini</strong> and <strong>Crete</strong>, tipping is appreciated but not mandatory. In restaurants, rounding up the bill or leaving 5–10% is common if service was good; many places include a service charge. For taxis, rounding up is usual. Tour guides and boat crews often receive €2–5 per person for half-day trips and more for full-day excursions. In hotels, a small amount (€1–2 per bag) for porters and a few euros per day for housekeeping is a nice gesture. Cash (euros) is preferred for tips.
        </p>
      </div>

      <div className="card">
        <h2 className="sectionLabel">Electric Outlets</h2>
        <p style={{ margin: '0 0 12px 0', lineHeight: 1.5 }}>
          Greece uses <strong>230 V, 50 Hz</strong> AC. Outlets are typically <strong>Type C</strong> (Europlug, two round pins) and <strong>Type F</strong> (Schuko, two round pins with side grounding clips). If your devices use North American (110–120 V) or UK (Type G) plugs, you’ll need a travel adapter; many phone and laptop chargers accept 100–240 V, so an adapter alone is enough.
        </p>
        <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8, display: 'inline-block' }}>
          <svg width="180" height="100" viewBox="0 0 180 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Type C and F plug shapes">
            <rect x="20" y="30" width="60" height="40" rx="4" fill="#333" />
            <circle cx="45" cy="50" r="4" fill="#fff" />
            <circle cx="75" cy="50" r="4" fill="#fff" />
            <text x="50" y="88" fontSize="12" fill="#555" textAnchor="middle">Type C (Europlug)</text>
            <rect x="100" y="25" width="70" height="50" rx="4" fill="#333" />
            <circle cx="120" cy="50" r="4" fill="#fff" />
            <circle cx="150" cy="50" r="4" fill="#fff" />
            <rect x="118" y="22" width="4" height="8" fill="#666" />
            <rect x="148" y="22" width="4" height="8" fill="#666" />
            <text x="135" y="88" fontSize="12" fill="#555" textAnchor="middle">Type F (Schuko)</text>
          </svg>
        </div>
      </div>

      <div className="card">
        <h2 className="sectionLabel">Typical phrases</h2>
        <p style={{ margin: '0 0 12px 0', color: '#5c5c5c', fontSize: 14 }}>A few useful phrases in Greek:</p>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li><strong>Hello / Goodbye</strong> — Γεια σας (Yia sas)</li>
          <li><strong>Please</strong> — Παρακαλώ (Parakaló)</li>
          <li><strong>Thank you</strong> — Ευχαριστώ (Efcharistó)</li>
          <li><strong>Yes / No</strong> — Ναι / Όχι (Neh / Ochi)</li>
          <li><strong>Excuse me / Sorry</strong> — Συγνώμη (Signómi)</li>
          <li><strong>How much?</strong> — Πόσο κάνει; (Póso káni?)</li>
          <li><strong>The bill, please</strong> — Τον λογαριασμό, παρακαλώ (Ton logariasmó, parakaló)</li>
          <li><strong>Where is the bathroom?</strong> — Πού είναι η τουαλέτα; (Pou eínai i toualéta?)</li>
          <li><strong>Cheers!</strong> — Γεια μας! (Yia mas!)</li>
        </ul>
      </div>
    </>
  );
}
