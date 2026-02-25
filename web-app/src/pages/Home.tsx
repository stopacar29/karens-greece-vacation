import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
      <div
        className="hero"
        style={{
          backgroundColor: '#1a4d6d',
          borderRadius: '0 0 24px 24px',
          margin: '-24px -24px 24px -24px',
          padding: '24px 24px 0',
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <img
          src="/santorini-karens-70th.png"
          alt="Santorini"
          style={{
            maxWidth: '100%',
            width: '100%',
            height: 'auto',
            maxHeight: 420,
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
      <div className="card">
        <h2 className="sectionLabel">Welcome</h2>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          Everything you need for our family trip: schedule, travel details, and the guest list. Use the tabs above to explore.
        </p>
      </div>
      <div className="card">
        <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#5c5c5c' }}>Quick links</h3>
        <p style={{ margin: '4px 0' }}><Link to="/schedule" style={{ color: '#1a4d6d', textDecoration: 'none' }}>📅 Schedule</Link> — calendar &amp; daily plans</p>
        <p style={{ margin: '4px 0' }}><Link to="/flights" style={{ color: '#1a4d6d', textDecoration: 'none' }}>✈️ Flights</Link> — flight details by family</p>
        <p style={{ margin: '4px 0' }}><Link to="/hotel-house" style={{ color: '#1a4d6d', textDecoration: 'none' }}>🏨 Hotel / House</Link> — Santorini &amp; Crete accommodation</p>
        <p style={{ margin: '4px 0' }}><Link to="/activities" style={{ color: '#1a4d6d', textDecoration: 'none' }}>📌 Activities</Link> — dinners, tours, transfers, important numbers</p>
        <p style={{ margin: '4px 0' }}><Link to="/family-gallery" style={{ color: '#1a4d6d', textDecoration: 'none' }}>🖼️ Family Gallery</Link> — upload and view trip photos</p>
        <p style={{ margin: '4px 0' }}><Link to="/travel-information" style={{ color: '#1a4d6d', textDecoration: 'none' }}>ℹ️ Travel Information</Link> — tipping, outlets, Greek phrases</p>
        <p style={{ margin: '4px 0' }}><Link to="/guests" style={{ color: '#1a4d6d', textDecoration: 'none' }}>👨‍👩‍👧‍👦 Guests</Link> — who&apos;s coming</p>
      </div>
    </>
  );
}
