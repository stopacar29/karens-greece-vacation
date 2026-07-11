export default function TravelInformation() {
  return (
    <>
      <div className="card">
        <h2 className="sectionLabel">Tipping Policy</h2>
        <p style={{ margin: '0 0 12px 0', lineHeight: 1.6 }}>
          <strong>Greece (Athens, Santorini, Crete):</strong> Tipping is appreciated but not mandatory. In restaurants, rounding up the bill or leaving 5–10% is common if service was good; many places include a service charge. For taxis, rounding up is usual. Tour guides and boat crews often receive €2–5 per person for half-day trips and more for full-day excursions. In hotels, €1–2 per bag for porters and a few euros per day for housekeeping is a nice gesture. Cash (euros) is preferred for tips.
        </p>
        <p style={{ margin: '0 0 12px 0', lineHeight: 1.6 }}>
          <strong>London (UK):</strong> Restaurants often add a 12.5% service charge automatically — check the bill, and don&apos;t tip twice. If no service charge, 10–12.5% is standard. No tipping at pubs or for counter service. Taxis: round up or add ~10%. Currency is the <strong>British pound (£)</strong>; cards are accepted almost everywhere.
        </p>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          <strong>Turkey (Istanbul, Cappadocia, Ephesus):</strong> Tipping ("bahşiş") is customary: 5–10% in restaurants (often cash-only even where cards are taken for the bill), small change for taxis, and a few dollars/euros per day for hotel staff and drivers. Guides on day tours typically get the equivalent of $5–10 per person. Currency is the <strong>Turkish lira (₺)</strong>, but euros and dollars are widely accepted for tips.
        </p>
      </div>

      <div className="card">
        <h2 className="sectionLabel">Electric Outlets</h2>
        <p style={{ margin: '0 0 12px 0', lineHeight: 1.5 }}>
          <strong>Greece and Turkey</strong> both use <strong>230 V, 50 Hz</strong> with <strong>Type C</strong> (Europlug, two round pins) and <strong>Type F</strong> (Schuko) outlets — one adapter covers Athens, Santorini, Crete, Istanbul, Cappadocia, and Ephesus.
          {' '}<strong>London</strong> uses <strong>230 V</strong> with <strong>Type G</strong> (three flat rectangular pins), so you&apos;ll need a separate UK adapter there.
          Most phone and laptop chargers accept 100–240 V, so adapters alone are enough — no voltage converter needed.
        </p>
        <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8, display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <svg width="100" height="70" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Type C Europlug">
              <rect x="15" y="20" width="70" height="35" rx="4" fill="#333" />
              <circle cx="40" cy="37" r="4" fill="#fff" />
              <circle cx="60" cy="37" r="4" fill="#fff" />
            </svg>
            <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#555' }}>Type C (Greece &amp; Turkey)</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <svg width="100" height="70" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Type F Schuko">
              <rect x="10" y="15" width="80" height="45" rx="4" fill="#333" />
              <circle cx="38" cy="37" r="4" fill="#fff" />
              <circle cx="62" cy="37" r="4" fill="#fff" />
              <rect x="36" y="12" width="4" height="8" fill="#666" />
              <rect x="60" y="12" width="4" height="8" fill="#666" />
            </svg>
            <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#555' }}>Type F (Greece &amp; Turkey)</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <svg width="100" height="70" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Type G UK plug">
              <rect x="10" y="10" width="80" height="52" rx="6" fill="#333" />
              <rect x="46" y="18" width="8" height="14" fill="#fff" />
              <rect x="28" y="40" width="14" height="8" fill="#fff" />
              <rect x="58" y="40" width="14" height="8" fill="#fff" />
            </svg>
            <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#555' }}>Type G (London)</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="sectionLabel">Typical phrases — Greek</h2>
        <p style={{ margin: '0 0 12px 0', color: '#5c5c5c', fontSize: 14 }}>For Athens, Santorini, and Crete. Greek with romanization and American phonetic pronunciation:</p>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, listStyle: 'none' }}>
          <li style={{ marginBottom: 14 }}>
            <strong>Hello / Goodbye</strong> — Γεια σας (Yia sas).<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: YAH sahs.</span>
          </li>
          <li style={{ marginBottom: 14 }}>
            <strong>Please</strong> — Παρακαλώ (Parakaló).<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: pah-rah-kah-LOH.</span>
          </li>
          <li style={{ marginBottom: 14 }}>
            <strong>Thank you</strong> — Ευχαριστώ (Efcharistó).<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: ef-hah-rees-TOH.</span>
          </li>
          <li style={{ marginBottom: 14 }}>
            <strong>Yes / No</strong> — Ναι / Όχι (Neh / Ochi).<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: neh / OH-hee.</span>
          </li>
          <li style={{ marginBottom: 14 }}>
            <strong>Excuse me / Sorry</strong> — Συγνώμη (Signómi).<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: seeg-NOH-mee.</span>
          </li>
          <li style={{ marginBottom: 14 }}>
            <strong>How much?</strong> — Πόσο κάνει; (Póso káni?).<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: POH-soh KAH-nee.</span>
          </li>
          <li style={{ marginBottom: 14 }}>
            <strong>The bill, please</strong> — Τον λογαριασμό, παρακαλώ (Ton logariasmó, parakaló).<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: tohn loh-gah-ryahz-MOH, pah-rah-kah-LOH.</span>
          </li>
          <li style={{ marginBottom: 14 }}>
            <strong>Where is the bathroom?</strong> — Πού είναι η τουαλέτα; (Pou eínai i toualéta?).<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: poo EE-neh ee too-ah-LEH-tah.</span>
          </li>
          <li style={{ marginBottom: 14 }}>
            <strong>Cheers!</strong> — Γεια μας! (Yia mas!).<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: yah mahs.</span>
          </li>
        </ul>
      </div>

      <div className="card">
        <h2 className="sectionLabel">Typical phrases — Turkish</h2>
        <p style={{ margin: '0 0 12px 0', color: '#5c5c5c', fontSize: 14 }}>For Istanbul, Cappadocia, and Ephesus:</p>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, listStyle: 'none' }}>
          <li style={{ marginBottom: 14 }}>
            <strong>Hello</strong> — Merhaba.<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: MEHR-hah-bah.</span>
          </li>
          <li style={{ marginBottom: 14 }}>
            <strong>Please</strong> — Lütfen.<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: LEWT-fen.</span>
          </li>
          <li style={{ marginBottom: 14 }}>
            <strong>Thank you</strong> — Teşekkür ederim.<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: teh-shek-KEWR eh-deh-reem.</span>
          </li>
          <li style={{ marginBottom: 14 }}>
            <strong>Yes / No</strong> — Evet / Hayır.<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: EH-vet / HAH-yuhr.</span>
          </li>
          <li style={{ marginBottom: 14 }}>
            <strong>How much?</strong> — Ne kadar?<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: neh kah-DAR.</span>
          </li>
          <li style={{ marginBottom: 14 }}>
            <strong>The bill, please</strong> — Hesap, lütfen.<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: heh-SAHP LEWT-fen.</span>
          </li>
          <li style={{ marginBottom: 14 }}>
            <strong>Where is the bathroom?</strong> — Tuvalet nerede?<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: too-vah-LET NEH-reh-deh.</span>
          </li>
          <li style={{ marginBottom: 14 }}>
            <strong>Cheers!</strong> — Şerefe!<br />
            <span style={{ color: '#5c5c5c', fontSize: 13 }}>Pronounced: sheh-reh-FEH.</span>
          </li>
        </ul>
        <p style={{ margin: '8px 0 0 0', color: '#5c5c5c', fontSize: 14 }}>London: they speak English, but "cheers" means both "thanks" and "cheers" — you&apos;ll fit right in.</p>
      </div>
    </>
  );
}
