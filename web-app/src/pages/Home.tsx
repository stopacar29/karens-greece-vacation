import { useState, useRef } from 'react';
import { useTrip } from '../context/TripContext';

export default function Home() {
  const { tripData, saveToServer, loadFromServer, mergeFromImport } = useTrip();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'loading' | 'loaded' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(tripData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `karens-greece-trip-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleSyncToServer = async () => {
    setSyncStatus('saving');
    setSyncMessage('');
    const result = await saveToServer();
    if (result.ok) {
      setSyncStatus('saved');
      setSyncMessage('Data saved to server. Other devices can load it.');
    } else {
      setSyncStatus('error');
      setSyncMessage(result.error || 'Save failed');
    }
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handleLoadFromServer = async () => {
    setSyncStatus('loading');
    setSyncMessage('');
    const result = await loadFromServer();
    if (result.ok) {
      setSyncStatus('loaded');
      setSyncMessage('Data loaded from server.');
    } else {
      setSyncStatus('error');
      setSyncMessage(result.error || 'Load failed');
    }
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handleRestoreFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text) as object;
        if (parsed && typeof parsed === 'object') {
          mergeFromImport(parsed);
          const res = await fetch('/api/trip', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) });
          if (res.ok) setSyncMessage('File restored and saved to server.');
          else setSyncMessage('Restored here but save to server failed.');
        } else {
          setSyncMessage('Invalid file format');
        }
      } catch {
        setSyncMessage('Could not read file');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div
        className="hero"
        style={{
          backgroundImage: 'url(/santorini-karens-70th.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center top',
          backgroundColor: '#1a4d6d',
          minHeight: 420,
          borderRadius: '0 0 24px 24px',
          margin: '-24px -24px 24px -24px',
        }}
      />
      <div className="card">
        <h2 className="sectionLabel">Welcome</h2>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          Everything you need for our family trip: schedule, travel details, and the guest list. Use the tabs above to explore.
        </p>
      </div>
      <div className="card">
        <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#1a4d6d' }}>Save &amp; sync data</h3>
        <p className="hint" style={{ margin: '0 0 12px 0' }}>
          Data is saved to this device and (when online) to the server so others can see it. Use the same website URL on all devices. If data is missing on another device, sync below.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <button type="button" className="btn btnSecondary" onClick={handleSyncToServer} disabled={syncStatus === 'saving'}>
            {syncStatus === 'saving' ? 'Saving…' : 'Sync to server now'}
          </button>
          <button type="button" className="btn btnSecondary" onClick={handleLoadFromServer} disabled={syncStatus === 'loading'}>
            {syncStatus === 'loading' ? 'Loading…' : 'Load from server'}
          </button>
          <button type="button" className="secondary" onClick={handleExport}>
            Export backup (JSON)
          </button>
          <label style={{ cursor: 'pointer' }}>
            <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleRestoreFromFile} style={{ display: 'none' }} />
            <span className="secondary" style={{ display: 'inline-block', padding: '6px 12px' }}>Restore from file</span>
          </label>
        </div>
        {(syncStatus === 'saved' || syncStatus === 'loaded' || syncStatus === 'error' || syncMessage) && (
          <p style={{ marginTop: 12, fontSize: 14, color: syncStatus === 'error' ? '#a00' : '#5c5c5c' }}>
            {syncStatus === 'saved' && 'Saved to server.'}
            {syncStatus === 'loaded' && 'Loaded from server.'}
            {syncStatus === 'error' && syncMessage}
            {syncMessage && !['saved', 'loaded', 'error'].includes(syncStatus) && syncMessage}
          </p>
        )}
      </div>
      <div className="card">
        <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#5c5c5c' }}>Quick links</h3>
        <p style={{ margin: '4px 0' }}>📅 Schedule — calendar &amp; daily plans</p>
        <p style={{ margin: '4px 0' }}>✈️ Flights — flight details by family</p>
        <p style={{ margin: '4px 0' }}>🏨 Hotel / House — Santorini &amp; Crete accommodation</p>
        <p style={{ margin: '4px 0' }}>📌 Activities — dinners, tours, transfers, important numbers</p>
        <p style={{ margin: '4px 0' }}>🖼️ Family Gallery — upload and view trip photos</p>
        <p style={{ margin: '4px 0' }}>ℹ️ Travel Information — tipping, outlets, Greek phrases</p>
        <p style={{ margin: '4px 0' }}>👨‍👩‍👧‍👦 Guests — who&apos;s coming</p>
      </div>
    </>
  );
}
