/**
 * PDF parser and trip data API for Karen's Greece trip app.
 * - GET /trip  -> load trip data (JSON file)
 * - PUT /trip  -> save trip data (JSON body)
 * - POST /parse, POST /ocr -> PDF/image extraction
 *
 * Set OPENAI_API_KEY for best results. Trip data is stored in server/data/trip.json.
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const OpenAI = require('openai').default;

const app = express();
const DATA_DIR = path.join(__dirname, 'data');
const TRIP_FILE = path.join(DATA_DIR, 'trip.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readTripData() {
  ensureDataDir();
  if (!fs.existsSync(TRIP_FILE)) return null;
  try {
    const raw = fs.readFileSync(TRIP_FILE, 'utf8');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Read trip data error:', e);
    return null;
  }
}

function writeTripData(data) {
  ensureDataDir();
  fs.writeFileSync(TRIP_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/trip', (req, res) => {
  try {
    const data = readTripData();
    if (data == null) {
      return res.status(404).json({ message: 'No trip data yet' });
    }
    res.json(data);
  } catch (e) {
    console.error('GET /trip error:', e);
    res.status(500).json({ error: e?.message || 'Failed to load trip data' });
  }
});

app.put('/trip', (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    writeTripData(data);
    res.json({ ok: true });
  } catch (e) {
    console.error('PUT /trip error:', e);
    res.status(500).json({ error: e?.message || 'Failed to save trip data' });
  }
});

// Same routes under /api for when server serves the built SPA (client calls /api/trip)
app.get('/api/trip', (req, res) => {
  try {
    const data = readTripData();
    if (data == null) {
      return res.status(404).json({ message: 'No trip data yet' });
    }
    res.json(data);
  } catch (e) {
    console.error('GET /api/trip error:', e);
    res.status(500).json({ error: e?.message || 'Failed to load trip data' });
  }
});
app.put('/api/trip', (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    writeTripData(data);
    res.json({ ok: true });
  } catch (e) {
    console.error('PUT /api/trip error:', e);
    res.status(500).json({ error: e?.message || 'Failed to save trip data' });
  }
});
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const TRIP_DATA_SCHEMA = `
Return valid JSON only, no markdown. Use this exact shape (use empty strings or empty arrays where you have no data):
{
  "tripStartDate": "",
  "tripEndDate": "",
  "flights": { "paul-karen": "", "lance-allison": "", "leah-brent": "", "noah-cori": "" },
  "accommodationSantorini": { "paul-karen": "", "lance-allison": "", "leah-brent": "", "noah-cori": "" },
  "accommodationCrete": { "paul-karen": "", "lance-allison": "", "leah-brent": "", "noah-cori": "" },
  "transfers": {
    "paul-karen": { "toAirport": "", "fromAirport": "" },
    "lance-allison": { "toAirport": "", "fromAirport": "" },
    "leah-brent": { "toAirport": "", "fromAirport": "" },
    "noah-cori": { "toAirport": "", "fromAirport": "" }
  },
  "schedule": [ { "day": "", "time": "", "title": "", "note": "" } ],
  "gettingAround": "",
  "importantNumbers": ""
}
Family ids: paul-karen, lance-allison, leah-brent, noah-cori. The trip has two main stays: Santorini and Crete. Put each family's accommodation in Santorini in accommodationSantorini and in Crete in accommodationCrete. Extract trip dates as YYYY-MM-DD if present.`;

async function extractTextFromPdf(buffer) {
  const data = await pdf(buffer);
  return data.text;
}

async function parseWithOpenAI(text) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You extract trip information from text and return only valid JSON matching the given schema. ${TRIP_DATA_SCHEMA}`,
      },
      {
        role: 'user',
        content: `Extract trip data from this text:\n\n${text.slice(0, 12000)}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });
  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error('No response from OpenAI');
  return JSON.parse(content);
}

function emptyTripData() {
  const ids = ['paul-karen', 'lance-allison', 'leah-brent', 'noah-cori'];
  return {
    tripStartDate: '',
    tripEndDate: '',
    flights: Object.fromEntries(ids.map((id) => [id, ''])),
    accommodationSantorini: Object.fromEntries(ids.map((id) => [id, ''])),
    accommodationCrete: Object.fromEntries(ids.map((id) => [id, ''])),
    transfers: Object.fromEntries(ids.map((id) => [id, { toAirport: '', fromAirport: '' }])),
    schedule: [],
    gettingAround: '',
    importantNumbers: '',
  };
}

app.post('/parse', async (req, res) => {
  try {
    const { pdfBase64, fileName } = req.body || {};
    if (!pdfBase64) {
      return res.status(400).json({ error: 'Missing pdfBase64 in body' });
    }
    let buffer;
    try {
      buffer = Buffer.from(pdfBase64, 'base64');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid base64 in PDF data.' });
    }
    let text;
    try {
      text = await extractTextFromPdf(buffer);
    } catch (e) {
      console.error('pdf-parse error:', e);
      return res.status(400).json({
        error: 'Could not read the PDF. It may be corrupted, password-protected, or image-only (scanned). Try exporting as text or copying the text into the paste box.',
      });
    }
    if (!text?.trim()) {
      return res.status(400).json({ error: 'No text could be extracted from the PDF (maybe scanned images?). Try pasting the text or using an image of the page with Import.' });
    }

    if (openai) {
      try {
        const parsed = await parseWithOpenAI(text);
        return res.json(parsed);
      } catch (e) {
        console.error('OpenAI parse error:', e);
        const msg = e?.message || String(e);
        return res.status(500).json({
          error: msg.includes('API key') || msg.includes('401') ? 'Invalid or missing OPENAI_API_KEY. Check your server environment.' : `Extraction failed: ${msg}`,
        });
      }
    }

    const fallback = emptyTripData();
    fallback.importantNumbers = 'PDF parser is running without OPENAI_API_KEY. Set OPENAI_API_KEY and restart the server to extract trip data from PDFs automatically.';
    res.json(fallback);
  } catch (e) {
    console.error('Parse request error:', e);
    res.status(500).json({ error: e?.message || 'Parse failed. Check the server terminal for details.' });
  }
});

async function extractTextFromImage(imageBase64, mimeType) {
  if (!openai) throw new Error('OPENAI_API_KEY is required to extract text from images.');
  const url = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract all text from this image exactly as it appears. Include any dates, flight numbers, names, addresses, and other details. If there is no text, respond with the single word: NONE',
          },
          { type: 'image_url', image_url: { url } },
        ],
      },
    ],
    max_tokens: 4096,
  });
  const text = response.choices[0]?.message?.content?.trim();
  if (!text || text === 'NONE') return '';
  return text;
}

app.post('/ocr', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in body' });
    }
    const text = await extractTextFromImage(imageBase64, mimeType || 'image/jpeg');
    if (!text?.trim()) {
      return res.status(400).json({ error: 'No text could be extracted from the image.' });
    }
    if (openai) {
      const parsed = await parseWithOpenAI(text);
      return res.json(parsed);
    }
    const fallback = emptyTripData();
    fallback.importantNumbers = 'Set OPENAI_API_KEY to extract trip data from pasted/chosen images.';
    res.json(fallback);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'OCR failed' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

// Serve built web app (for deployment: build with "npm run build" in web-app, then run server)
const WEB_APP_ROOT = path.join(__dirname, '..', 'web-app', 'dist');
if (fs.existsSync(WEB_APP_ROOT)) {
  app.use(express.static(WEB_APP_ROOT));
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    const p = path.join(WEB_APP_ROOT, req.path);
    if (fs.existsSync(p) && !fs.statSync(p).isDirectory()) return next();
    res.sendFile(path.join(WEB_APP_ROOT, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  if (fs.existsSync(WEB_APP_ROOT)) console.log('Serving web app from web-app/dist');
  if (!OPENAI_API_KEY) console.log('Set OPENAI_API_KEY for automatic extraction from PDFs.');
});
