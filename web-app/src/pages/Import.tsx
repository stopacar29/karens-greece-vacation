import { useState, useCallback } from 'react';
import { useTrip } from '../context/TripContext';
import type { TripData } from '../types/trip';
import { FAMILIES } from '../constants/families';
import { normalizeFlight } from '../types/trip';

/** Ensure flights is Record<string, FlightInfo[]> for mergeFromImport. */
function normalizeParsedFlights(partial: Partial<TripData> & { flights?: Record<string, unknown> }): Partial<TripData> {
  if (!partial.flights || typeof partial.flights !== 'object') return partial;
  const out: Record<string, import('../types/trip').FlightInfo[]> = {};
  for (const id of Object.keys(partial.flights)) {
    const v = partial.flights[id];
    out[id] = Array.isArray(v) ? v.slice(0, 5).map(normalizeFlight) : [normalizeFlight(v)];
  }
  return { ...partial, flights: out };
}

const API = ''; // same origin; Vite proxy sends /api to backend

async function readFileAsBase64(file: File): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) resolve({ base64: match[2], mime: match[1] });
      else reject(new Error('Could not read file'));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function parsePdf(base64: string, fileName: string): Promise<Partial<TripData>> {
  const res = await fetch(`${API}/api/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfBase64: base64, fileName }),
  });
  let data: { error?: string } = {};
  try {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    }
  } catch {
    // ignore
  }
  if (!res.ok) {
    throw new Error(data.error || res.statusText || 'PDF parse failed. Check the server terminal for the real error.');
  }
  return data as Partial<TripData>;
}

async function parseImage(base64: string, mime: string): Promise<Partial<TripData>> {
  const res = await fetch(`${API}/api/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType: mime }),
  });
  let data: { error?: string } = {};
  try {
    if (res.headers.get('content-type')?.includes('application/json')) data = await res.json();
  } catch {
    // ignore
  }
  if (!res.ok) throw new Error(data.error || res.statusText || 'OCR failed.');
  return (data as unknown) as Partial<TripData>;
}

function parsePastedText(text: string): Partial<TripData> {
  const partial: Partial<TripData> = {};
  const dateRe = /\b(20\d{2})-(\d{2})-(\d{2})\b/g;
  const dates: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = dateRe.exec(text)) !== null) dates.push(m[0]);
  if (dates.length >= 2) {
    const sorted = [...new Set(dates)].sort();
    partial.tripStartDate = sorted[0];
    partial.tripEndDate = sorted[sorted.length - 1];
  } else if (dates.length === 1) {
    partial.tripStartDate = dates[0];
    partial.tripEndDate = dates[0];
  }
  const familyIds = FAMILIES.map((f) => f.id);
  const familyNames = FAMILIES.map((f) => f.name);
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const flightBlocks: Record<string, string> = {};
  for (let i = 0; i < familyNames.length; i++) {
    const name = familyNames[i];
    const id = familyIds[i];
    const nameParts = name.split(/\s+and\s+/);
    for (const line of lines) {
      const lower = line.toLowerCase();
      const hasName = nameParts.some((p) => lower.includes(p.toLowerCase()));
      const hasFlight = /\bflight|depart|arriv|airline|airport\b/i.test(line);
      if (hasName && (hasFlight || line.length > 20)) {
        flightBlocks[id] = (flightBlocks[id] || '').concat(flightBlocks[id] ? '\n' : '', line).trim();
      }
    }
  }
  if (Object.keys(flightBlocks).length > 0) {
    partial.flights = Object.fromEntries(
      Object.entries(flightBlocks).map(([id, s]) => [id, [normalizeFlight(s)]])
    );
  }
  return partial;
}

export default function Import() {
  const { mergeFromImport } = useTrip();
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [pastedText, setPastedText] = useState('');

  const processFile = useCallback(
    async (file: File) => {
      const isPdf = file.type === 'application/pdf';
      const isImage = /^image\/(jpeg|jpg|png)$/i.test(file.type);
      if (!isPdf && !isImage) {
        setMessage('Please choose a PDF or image (JPEG/PNG).');
        setStatus('error');
        return;
      }
      setStatus('processing');
      setMessage('Reading file…');
      try {
        const { base64, mime } = await readFileAsBase64(file);
        const parsed = isPdf
          ? await parsePdf(base64, file.name)
          : await parseImage(base64, mime);
        mergeFromImport(normalizeParsedFlights(parsed));
        setStatus('done');
        setMessage(isPdf ? 'Trip data updated from PDF. Check Schedule and Travel.' : 'Trip data updated from image. Check Schedule and Travel.');
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Import failed.');
      }
    },
    [mergeFromImport]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = '';
    },
    [processFile]
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (files?.length) {
        e.preventDefault();
        const file = files[0];
        const isPdf = file.type === 'application/pdf';
        const isImage = /^image\/(jpeg|jpg|png)$/i.test(file.type);
        if (isPdf || isImage) processFile(file);
      }
    },
    [processFile]
  );

  const importPastedText = useCallback(() => {
    const trimmed = pastedText.trim();
    if (!trimmed) {
      setMessage('Paste or type some text first.');
      setStatus('error');
      return;
    }
    setStatus('processing');
    setMessage('');
    try {
      const parsed = parsePastedText(trimmed);
      mergeFromImport(normalizeParsedFlights(parsed));
      setStatus('done');
      setMessage('Trip data updated from pasted text. Check Schedule and Travel.');
    } catch {
      setStatus('error');
      setMessage('Could not extract trip data from text.');
    }
  }, [pastedText, mergeFromImport]);

  return (
    <>
      <div className="card">
        <h2 className="sectionLabel">Import from PDF or image</h2>
        <p className="hint">
          Choose a file or paste one into the box below. The server will extract text and fill trip data (Schedule, Travel). Make sure the backend is running on port 3000.
        </p>

        <div className="inputRow">
          <label>Choose file (PDF, JPEG, PNG)</label>
          <input type="file" accept=".pdf,application/pdf,image/jpeg,image/png,image/jpg" onChange={onFileChange} />
        </div>

        <div className="inputRow" style={{ marginTop: 16 }}>
          <label>Or paste here — text, or an image/PDF (Ctrl+V / Cmd+V)</label>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            onPaste={onPaste}
            placeholder="Paste trip details, flight info, or paste an image/PDF from your clipboard…"
            rows={6}
          />
        </div>
        <button type="button" className="btn btnSecondary" onClick={importPastedText}>
          Import pasted text
        </button>

        {message && (
          <div className={`message ${status === 'error' ? 'messageError' : 'messageSuccess'}`} style={{ marginTop: 12 }}>
            {status === 'processing' && '⏳ '}
            {message}
          </div>
        )}
      </div>
    </>
  );
}
