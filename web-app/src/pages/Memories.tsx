import { useState, useEffect, useCallback, useRef } from 'react';
import { FAMILIES } from '../constants/families';

type Memory = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  editedAt?: string;
};

function apiBase(): string {
  return '';
}

// Browser speech recognition (Safari/iOS and Chrome). Not in TS lib types.
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function Memories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechSupported = getSpeechRecognition() !== null;

  const loadMemories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase()}/api/memories`);
      if (!res.ok) throw new Error('Failed to load memories');
      const data = await res.json();
      setMemories(Array.isArray(data.memories) ? data.memories : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load memories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  // Stop the microphone if the user navigates away mid-dictation.
  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  };

  const startListening = () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
      }
      if (transcript) {
        setText((prev) => (prev ? prev.replace(/\s+$/, '') + ' ' + transcript.trim() : transcript.trim()));
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const submit = async () => {
    if (!author) {
      setError('Please pick who you are first.');
      return;
    }
    if (!text.trim()) {
      setError('Please write or dictate a memory first.');
      return;
    }
    stopListening();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase()}/api/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text: text.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Could not save the memory');
      }
      const data = await res.json();
      if (data.memory) setMemories((prev) => [data.memory, ...prev]);
      setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the memory');
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase()}/api/memories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Could not save the change');
      }
      const data = await res.json();
      if (data.memory) {
        setMemories((prev) => prev.map((m) => (m.id === id ? data.memory : m)));
      }
      setEditingId(null);
      setEditText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the change');
    } finally {
      setSaving(false);
    }
  };

  // Explicit, confirmed single-memory delete (preserve-trip-data rule).
  const deleteMemory = async (memory: Memory) => {
    const ok = window.confirm(
      `Delete ${memory.author}'s memory for everyone? This cannot be undone.`
    );
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase()}/api/memories/${memory.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Could not delete the memory');
      }
      setMemories((prev) => prev.filter((m) => m.id !== memory.id));
      if (editingId === memory.id) setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the memory');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="card">
        <h2 className="sectionLabel">Memories</h2>
        <p className="hint">
          Leave a favorite memory from the trip. Pick your name, then type it or tap the microphone and just talk —
          everyone in the family will see it here.
        </p>
        <div className="inputRow">
          <label>Who are you?</label>
          <select value={author} onChange={(e) => setAuthor(e.target.value)} disabled={saving}>
            <option value="">Choose your name…</option>
            {FAMILIES.map((family) => (
              <optgroup key={family.id} label={family.name}>
                {family.members.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="inputRow">
          <label>Your memory</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={listening ? 'Listening… speak your memory' : 'One of my favorite moments was…'}
            disabled={saving}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {speechSupported ? (
            <button
              className="btn"
              onClick={listening ? stopListening : startListening}
              disabled={saving}
              style={{
                marginLeft: 0,
                background: listening ? '#b3402e' : '#6b7c5c',
                color: '#fff',
              }}
            >
              {listening ? '■ Stop dictating' : '🎤 Dictate'}
            </button>
          ) : (
            <span className="hint" style={{ margin: 0 }}>
              Dictation isn’t available in this browser — you can still type your memory.
            </span>
          )}
          <button className="btn btnPrimary" onClick={submit} disabled={saving} style={{ marginLeft: 0 }}>
            {saving ? 'Saving…' : 'Save memory'}
          </button>
        </div>
        {listening && (
          <p className="hint" style={{ marginTop: 10, marginBottom: 0 }}>
            Listening — your words will appear in the box above. Tap “Stop dictating” when you’re done.
          </p>
        )}
        {error && <p style={{ color: '#a00', marginTop: 12, fontSize: 14 }}>{error}</p>}
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#1a4d6d' }}>Memory log</h3>
        {loading ? (
          <p style={{ color: '#5c5c5c' }}>Loading…</p>
        ) : memories.length === 0 ? (
          <p style={{ color: '#5c5c5c' }}>No memories yet. Be the first to leave one!</p>
        ) : (
          memories.map((memory) => (
            <div
              key={memory.id}
              style={{
                borderTop: '1px solid #e5e5e5',
                padding: '14px 0',
              }}
            >
              {editingId === memory.id ? (
                <>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 15 }}
                    disabled={saving}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <button
                      className="btn btnPrimary"
                      style={{ marginLeft: 0 }}
                      disabled={saving || !editText.trim()}
                      onClick={() => saveEdit(memory.id)}
                    >
                      Save change
                    </button>
                    <button
                      className="btn btnSecondary"
                      style={{ marginLeft: 0 }}
                      disabled={saving}
                      onClick={() => {
                        setEditingId(null);
                        setEditText('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ margin: '0 0 8px 0', fontSize: 15, whiteSpace: 'pre-wrap' }}>{memory.text}</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#5c5c5c' }}>
                    — <strong style={{ color: '#1a4d6d' }}>{memory.author}</strong> · {formatDate(memory.createdAt)}
                    {memory.editedAt && ' (edited)'}
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {author === memory.author && (
                      <button
                        className="btn btnSecondary"
                        style={{ marginLeft: 0, padding: '8px 14px', fontSize: 14 }}
                        disabled={saving}
                        onClick={() => {
                          setEditingId(memory.id);
                          setEditText(memory.text);
                        }}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      className="btn"
                      style={{ marginLeft: 0, padding: '8px 14px', fontSize: 14, background: '#b3402e', color: '#fff' }}
                      disabled={saving}
                      onClick={() => deleteMemory(memory)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
