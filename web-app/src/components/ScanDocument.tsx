import { useRef, useState } from 'react';
import { useTrip } from '../context/TripContext';
import type { TripData } from '../types/trip';

type Stage =
  | { step: 'idle' }
  | { step: 'extracting' }
  | { step: 'questions'; data: Partial<TripData>; questions: string[]; answers: string[] }
  | { step: 'applying' }
  | { step: 'done'; note: string }
  | { step: 'error'; note: string };

async function fileToBase64(file: File): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const m = (reader.result as string).match(/^data:([^;]+);base64,(.+)$/);
      if (m) resolve({ base64: m[2], mime: m[1] });
      else reject(new Error('Could not read the photo'));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * "Scan a document": photograph a booking/itinerary, Claude extracts the
 * data, asks follow-up questions for anything it couldn't figure out, and
 * the answers are merged into the shared trip data.
 */
export default function ScanDocument() {
  const { mergeFromImport, saveToServer } = useTrip();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>({ step: 'idle' });

  const applyData = async (data: Partial<TripData>) => {
    setStage({ step: 'applying' });
    mergeFromImport(data);
    const res = await saveToServer();
    setStage(res.ok
      ? { step: 'done', note: 'Added to the trip and shared with everyone. Check the Schedule.' }
      : { step: 'error', note: `Saved on this device, but sharing failed: ${res.error}` });
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !/^image\//i.test(file.type)) {
      setStage({ step: 'error', note: 'Please choose a photo (JPEG or PNG).' });
      return;
    }
    setStage({ step: 'extracting' });
    try {
      const { base64, mime } = await fileToBase64(file);
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: mime }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || 'Could not read the document');
      const data = (out.data ?? {}) as Partial<TripData>;
      const questions = Array.isArray(out.questions) ? (out.questions as string[]).filter(Boolean) : [];
      if (questions.length === 0) {
        await applyData(data);
      } else {
        setStage({ step: 'questions', data, questions, answers: questions.map(() => '') });
      }
    } catch (err) {
      setStage({ step: 'error', note: err instanceof Error ? err.message : 'Scan failed.' });
    }
  };

  const submitAnswers = async () => {
    if (stage.step !== 'questions') return;
    setStage({ step: 'applying' });
    try {
      const res = await fetch('/api/scan/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: stage.data, questions: stage.questions, answers: stage.answers }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || 'Could not apply your answers');
      await applyData(out as Partial<TripData>);
    } catch (err) {
      setStage({ step: 'error', note: err instanceof Error ? err.message : 'Could not apply your answers.' });
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <button
        type="button"
        className="btn btnPrimary"
        onClick={() => fileRef.current?.click()}
        disabled={stage.step === 'extracting' || stage.step === 'applying'}
      >
        {stage.step === 'extracting' ? '⏳ Reading the document…' : stage.step === 'applying' ? '⏳ Adding to the trip…' : '📷 Scan a document'}
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
      <p className="hint" style={{ marginTop: 6 }}>
        Take a picture of a booking, ticket, or itinerary. Claude fills in what it can and asks you about the rest.
      </p>

      {stage.step === 'questions' && (
        <div style={{ marginTop: 8, padding: 12, background: '#f5f8fa', borderRadius: 12 }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 600, color: '#1a4d6d' }}>
            A few things the document didn&apos;t say — answer what you can:
          </p>
          {stage.questions.map((q, i) => (
            <div className="inputRow" key={i}>
              <label>{q}</label>
              <input
                value={stage.answers[i]}
                onChange={(e) => {
                  const answers = [...stage.answers];
                  answers[i] = e.target.value;
                  setStage({ ...stage, answers });
                }}
                placeholder="Type your answer (or leave blank)"
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btnPrimary" onClick={submitAnswers}>Add to the trip</button>
            <button type="button" className="btn btnSecondary" style={{ marginLeft: 0 }} onClick={() => setStage({ step: 'idle' })}>Cancel</button>
          </div>
        </div>
      )}

      {(stage.step === 'done' || stage.step === 'error') && (
        <div className={`message ${stage.step === 'done' ? 'messageSuccess' : 'messageError'}`}>{stage.note}</div>
      )}
    </div>
  );
}
