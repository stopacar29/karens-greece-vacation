import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import type { TripData } from '../types/trip';

export default function Home() {
  const { tripData, mergeFromImport, saveToServer, loadFromServer } = useTrip();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(tripData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'karens-70th-trip-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ kind: 'ok', text: 'Backup downloaded. Keep it somewhere safe.' });
  };

  const restoreFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Partial<TripData>;
      if (!parsed || typeof parsed !== 'object') throw new Error('Not a trip backup file');
      mergeFromImport(parsed);
      const res = await saveToServer();
      setMessage(res.ok
        ? { kind: 'ok', text: 'Backup restored and shared with everyone.' }
        : { kind: 'err', text: `Restored locally, but sharing failed: ${res.error}` });
    } catch {
      setMessage({ kind: 'err', text: 'That file does not look like a trip backup (JSON).' });
    }
  };

  const syncNow = async () => {
    const res = await saveToServer();
    setMessage(res.ok ? { kind: 'ok', text: 'Your data is synced for everyone.' } : { kind: 'err', text: `Sync failed: ${res.error}` });
  };

  const loadNow = async () => {
    const res = await loadFromServer();
    setMessage(res.ok ? { kind: 'ok', text: 'Loaded the latest shared data.' } : { kind: 'err', text: `Load failed: ${res.error}` });
  };

  return (
    <>
      <div
        className="hero"
        style={{
          backgroundColor: '#1a4d6d',
          borderRadius: '0 0 24px 24px',
          margin: '-24px -24px 24px -24px',
          padding: 24,
          overflow: 'hidden',
        }}
      >
        <img
          src="/santorini-karens-70th.png"
          alt="Santorini"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: 8,
          }}
        />
      </div>
      <div className="card">
        <h2 className="sectionLabel">Welcome</h2>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          Everything you need for our family trip — Athens, Santorini, Crete, London, Istanbul, Cappadocia, and Ephesus: schedule, travel details, and the guest list. Use the tabs above to explore.
        </p>
      </div>
      <div className="card">
        <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#5c5c5c' }}>Quick links</h3>
        <p style={{ margin: '4px 0' }}><Link to="/schedule" style={{ color: '#1a4d6d', textDecoration: 'none' }}>📅 Schedule</Link> — calendar &amp; daily plans</p>
        <p style={{ margin: '4px 0' }}><Link to="/flights" style={{ color: '#1a4d6d', textDecoration: 'none' }}>✈️ Flights</Link> — flight details by family</p>
        <p style={{ margin: '4px 0' }}><Link to="/hotel-house" style={{ color: '#1a4d6d', textDecoration: 'none' }}>🏨 Hotel / House</Link> — where we&apos;re staying at every stop</p>
        <p style={{ margin: '4px 0' }}><Link to="/activities" style={{ color: '#1a4d6d', textDecoration: 'none' }}>📌 Activities</Link> — dinners, tours, transfers, important numbers</p>
        <p style={{ margin: '4px 0' }}><Link to="/family-gallery" style={{ color: '#1a4d6d', textDecoration: 'none' }}>🖼️ Family Gallery</Link> — upload and view trip photos</p>
        <p style={{ margin: '4px 0' }}><Link to="/travel-information" style={{ color: '#1a4d6d', textDecoration: 'none' }}>ℹ️ Travel Information</Link> — tipping, outlets, Greek phrases</p>
        <p style={{ margin: '4px 0' }}><Link to="/map" style={{ color: '#1a4d6d', textDecoration: 'none' }}>🗺️ Map</Link> — interactive map with AI suggestions</p>
        <p style={{ margin: '4px 0' }}><Link to="/guests" style={{ color: '#1a4d6d', textDecoration: 'none' }}>👨‍👩‍👧‍👦 Guests</Link> — who&apos;s coming</p>
      </div>
      <div className="card">
        <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#5c5c5c' }}>Data &amp; backup</h3>
        <p className="hint">Everything saves automatically. These are extra safety valves.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btnSecondary" style={{ marginLeft: 0 }} onClick={exportBackup}>Export backup (JSON)</button>
          <button type="button" className="btn btnSecondary" style={{ marginLeft: 0 }} onClick={() => fileRef.current?.click()}>Restore from file</button>
          <button type="button" className="btn btnSecondary" style={{ marginLeft: 0 }} onClick={syncNow}>Sync to server now</button>
          <button type="button" className="btn btnSecondary" style={{ marginLeft: 0 }} onClick={loadNow}>Load from server</button>
        </div>
        <input ref={fileRef} type="file" accept=".json,application/json" onChange={restoreFromFile} style={{ display: 'none' }} />
        {message && (
          <div className={`message ${message.kind === 'ok' ? 'messageSuccess' : 'messageError'}`}>{message.text}</div>
        )}
      </div>
    </>
  );
}
