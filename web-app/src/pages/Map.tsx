import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Suggestion = { name: string; description: string; bestFor: string; cost: string };

// Key locations for the trip
const LOCATIONS = [
  { name: 'Athens (Acropolis)', lat: 37.9715, lng: 23.7267, icon: 'ruins' },
  { name: 'London', lat: 51.5074, lng: -0.1278, icon: 'city' },
  { name: 'Istanbul (Hagia Sophia)', lat: 41.0086, lng: 28.9802, icon: 'city' },
  { name: 'Cappadocia (Göreme)', lat: 38.6431, lng: 34.8289, icon: 'hike' },
  { name: 'Ephesus', lat: 37.9411, lng: 27.3419, icon: 'ruins' },
  { name: 'Santorini (Fira)', lat: 36.4165, lng: 25.4322, icon: 'city' },
  { name: 'Oia, Santorini', lat: 36.4614, lng: 25.3753, icon: 'sunset' },
  { name: 'Kamari Beach', lat: 36.3752, lng: 25.4848, icon: 'beach' },
  { name: 'Perissa Beach', lat: 36.3553, lng: 25.4741, icon: 'beach' },
  { name: 'Red Beach, Santorini', lat: 36.3485, lng: 25.3962, icon: 'beach' },
  { name: 'Akrotiri Archaeological Site', lat: 36.3517, lng: 25.4035, icon: 'ruins' },
  { name: 'Nea Kameni Volcano', lat: 36.4005, lng: 25.3963, icon: 'volcano' },
  { name: 'Santo Wines Winery', lat: 36.3868, lng: 25.4505, icon: 'wine' },
  { name: 'Heraklion, Crete', lat: 35.3387, lng: 25.1442, icon: 'city' },
  { name: 'Chania Old Town', lat: 35.5174, lng: 24.0179, icon: 'city' },
  { name: 'Rethymno, Crete', lat: 35.3653, lng: 24.4735, icon: 'city' },
  { name: 'Elafonissi Beach', lat: 35.2727, lng: 23.5416, icon: 'beach' },
  { name: 'Balos Lagoon', lat: 35.5789, lng: 23.5893, icon: 'beach' },
  { name: 'Knossos Palace', lat: 35.2979, lng: 25.1625, icon: 'ruins' },
  { name: 'Samaria Gorge', lat: 35.3072, lng: 23.9625, icon: 'hike' },
  { name: 'Spinalonga Island', lat: 35.3002, lng: 25.7478, icon: 'ruins' },
];

const ICON_EMOJI: Record<string, string> = {
  city: '\u{1f3d8}',
  sunset: '\u{1f305}',
  beach: '\u{1f3d6}',
  ruins: '\u{1f3db}',
  volcano: '\u{1f30b}',
  wine: '\u{1f377}',
  hike: '\u{26f0}',
};

function makeIcon(type: string) {
  const emoji = ICON_EMOJI[type] || '\u{1f4cd}';
  return L.divIcon({
    className: 'map-emoji-icon',
    html: `<span style="font-size:28px;line-height:1">${emoji}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  });
}

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const [selected, setSelected] = useState<typeof LOCATIONS[0] | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current);
    leafletMap.current = map;

    // Esri World Street Map: place names labeled in English
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri — Sources: Esri, HERE, Garmin, OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Start zoomed to show every stop on the trip
    map.fitBounds(L.latLngBounds(LOCATIONS.map((l) => [l.lat, l.lng] as [number, number])), { padding: [30, 30] });

    LOCATIONS.forEach((loc) => {
      const marker = L.marker([loc.lat, loc.lng], { icon: makeIcon(loc.icon) }).addTo(map);
      marker.bindTooltip(loc.name, { direction: 'top', offset: [0, -28] });
      marker.on('click', () => {
        setSelected(loc);
        setSuggestions([]);
        setError('');
      });
    });

    return () => { map.remove(); leafletMap.current = null; };
  }, []);

  const fetchSuggestions = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    setSuggestions([]);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: selected.name, lat: selected.lat, lng: selected.lng }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (e: any) {
      setError(e.message || 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card">
        <h2 className="sectionLabel">Trip Map</h2>
        <p className="hint">All our stops: Athens, Santorini, Crete, London, Istanbul, Cappadocia, and Ephesus. Tap a pin to learn about it, then ask Claude for suggestions. Zoom in for detail.</p>
        <div
          ref={mapRef}
          style={{ width: '100%', height: 420, borderRadius: 12, overflow: 'hidden', marginTop: 12 }}
        />
      </div>

      {selected && (
        <div className="card">
          <h2 className="sectionLabel">{selected.name}</h2>
          <p className="hint">Coordinates: {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}</p>
          <button
            className="btn btnPrimary"
            onClick={fetchSuggestions}
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Asking Claude...' : 'Get suggestions from Claude'}
          </button>

          {error && <div className="message messageError" style={{ marginTop: 12 }}>{error}</div>}

          {suggestions.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{
                  padding: '12px 0',
                  borderBottom: i < suggestions.length - 1 ? '1px solid #eee' : 'none',
                }}>
                  <div style={{ fontWeight: 600, color: '#1a4d6d', fontSize: 15 }}>{s.name}</div>
                  <div style={{ fontSize: 14, marginTop: 4 }}>{s.description}</div>
                  <div style={{ fontSize: 13, color: '#5c5c5c', marginTop: 4 }}>
                    <span style={{ marginRight: 16 }}>{s.bestFor}</span>
                    <span style={{ color: '#c9a227', fontWeight: 600 }}>{s.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
