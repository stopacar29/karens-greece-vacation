require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

/**
 * Trip data API + AI import for Karen's trip app (local development server).
 * - GET/PUT /api/trip -> load/save trip data (JSON file)
 * - POST /api/parse, /api/ocr -> PDF/image extraction via Claude
 * - POST /api/suggestions -> map suggestions via Claude
 *
 * Set ANTHROPIC_API_KEY (in ../.env) for the AI features.
 * Trip data is stored in server/data/trip.json.
 * In production these same endpoints run as Netlify Functions.
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Use DATA_DIR env for persistent storage (e.g. Render disk mounted at /data)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const TRIP_FILE = path.join(DATA_DIR, 'trip.json');
const GALLERY_DIR = path.join(DATA_DIR, 'gallery');

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
      // Return empty valid object so client can merge; avoids "no data" confusion when server was reset
      return res.json({});
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

// Gallery: allow anyone with the link to upload and view photos
function ensureGalleryDir() {
  if (!fs.existsSync(GALLERY_DIR)) {
    fs.mkdirSync(GALLERY_DIR, { recursive: true });
  }
}

// Comments/captions live in a small sidecar JSON file next to the photos, keyed
// by filename, so editing a caption never touches the photo bytes themselves.
const CAPTIONS_FILE = path.join(GALLERY_DIR, 'captions.json');
const MAX_CAPTION_LENGTH = 4000;

function readCaptions() {
  ensureGalleryDir();
  if (!fs.existsSync(CAPTIONS_FILE)) return {};
  try {
    const raw = fs.readFileSync(CAPTIONS_FILE, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Read captions error:', e);
    return {};
  }
}

function writeCaptions(captions) {
  ensureGalleryDir();
  fs.writeFileSync(CAPTIONS_FILE, JSON.stringify(captions, null, 2), 'utf8');
}
const galleryStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureGalleryDir();
    cb(null, GALLERY_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase().replace(/[^a-z]/g, '');
    const safe = ext || 'jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safe}`);
  },
});
const upload = multer({ storage: galleryStorage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

app.post('/api/gallery/upload', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/api/gallery/images/${req.file.filename}`;
    res.json({ url });
  } catch (e) {
    console.error('Gallery upload error:', e);
    res.status(500).json({ error: e?.message || 'Upload failed' });
  }
});

app.get('/api/gallery', (req, res) => {
  try {
    ensureGalleryDir();
    const names = fs.readdirSync(GALLERY_DIR).filter((n) => /\.(jpg|jpeg|png|gif|webp)$/i.test(n));
    const captions = readCaptions();
    const images = names.map((n) => ({ url: `/api/gallery/images/${n}`, caption: captions[n]?.caption || undefined }));
    res.json({ images });
  } catch (e) {
    console.error('Gallery list error:', e);
    res.status(500).json({ error: e?.message || 'Failed to list images' });
  }
});

app.put('/api/gallery/images/:filename/caption', (req, res) => {
  try {
    const name = path.basename(req.params.filename);
    if (!/^[0-9a-z\-\.]+\.(jpg|jpeg|png|gif|webp)$/i.test(name)) return res.status(400).json({ error: 'Bad filename' });
    const filePath = path.resolve(GALLERY_DIR, name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Photo not found' });
    const caption = typeof req.body?.caption === 'string' ? req.body.caption.trim() : '';
    if (caption.length > MAX_CAPTION_LENGTH) return res.status(413).json({ error: 'That comment is too long' });
    const captions = readCaptions();
    if (caption) {
      captions[name] = { caption, updatedAt: new Date().toISOString() };
    } else {
      delete captions[name];
    }
    writeCaptions(captions);
    res.json({ url: `/api/gallery/images/${name}`, caption });
  } catch (e) {
    console.error('Gallery caption error:', e);
    res.status(500).json({ error: e?.message || 'Failed to save comment' });
  }
});

app.delete('/api/gallery/images/:filename', (req, res) => {
  try {
    const name = path.basename(req.params.filename);
    if (!/^[0-9a-z\-\.]+\.(jpg|jpeg|png|gif|webp)$/i.test(name)) return res.status(400).json({ error: 'Bad filename' });
    const filePath = path.resolve(GALLERY_DIR, name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Photo not found' });
    fs.unlinkSync(filePath);
    const captions = readCaptions();
    if (captions[name]) {
      delete captions[name];
      writeCaptions(captions);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('Gallery delete error:', e);
    res.status(500).json({ error: e?.message || 'Failed to delete photo' });
  }
});

app.get('/api/gallery/images/:filename', (req, res) => {
  try {
    const name = path.basename(req.params.filename);
    if (!/^[0-9a-z\-\.]+\.(jpg|jpeg|png|gif|webp)$/i.test(name)) return res.status(400).end();
    const filePath = path.resolve(GALLERY_DIR, name);
    if (!fs.existsSync(filePath)) return res.status(404).end();
    const ext = path.extname(name).toLowerCase();
    const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
    if (types[ext]) res.setHeader('Content-Type', types[ext]);
    res.sendFile(filePath);
  } catch (e) {
    res.status(500).end();
  }
});

// --- Claude AI suggestions for map locations ---
const Anthropic = require('@anthropic-ai/sdk');
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const anthropic = ANTHROPIC_API_KEY ? new Anthropic.default({ apiKey: ANTHROPIC_API_KEY }) : null;

app.post('/suggestions', async (req, res) => {
  req.url = '/api/suggestions';
  return app._router.handle(req, res, () => {});
});

app.post('/api/suggestions', async (req, res) => {
  try {
    const { location, lat, lng } = req.body || {};
    if (!location) return res.status(400).json({ error: 'Missing location name' });
    if (!anthropic) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set on server' });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a travel guide for a family vacation in July/August 2026 visiting Athens, Santorini, Crete, London, Istanbul, Cappadocia, and Ephesus. The group includes grandparents, parents, and children ages roughly 3-15.

Give me 6-8 suggestions of things to do at or near "${location}" (coordinates: ${lat}, ${lng}). For each suggestion include:
- Name of the activity/place
- A one-sentence description
- Who it's best for (e.g. "great for kids", "romantic for couples", "everyone")
- Approximate cost (free, $, $$, $$$)

Format as JSON array: [{"name": "...", "description": "...", "bestFor": "...", "cost": "..."}]
Return only valid JSON, no markdown.`
      }],
    });

    const text = message.content[0]?.text?.trim();
    const suggestions = JSON.parse(text);
    res.json({ location, suggestions });
  } catch (e) {
    console.error('Suggestions error:', e);
    res.status(500).json({ error: e?.message || 'Failed to get suggestions' });
  }
});

const TRIP_DATA_SCHEMA = `
Return valid JSON only, no markdown. Use this exact shape (use empty strings or empty arrays where you have no data):
{
  "tripStartDate": "",
  "tripEndDate": "",
  "flights": { "paul-karen": [], "lance-allison": [], "leah-brent": [], "noah-cori": [] },
  "accommodationList": { "all": [], "paul-karen": [], "lance-allison": [], "leah-brent": [], "noah-cori": [] },
  "activities": { "all": [], "adults": [], "paul-karen": [], "lance-allison": [], "leah-brent": [], "noah-cori": [] },
  "transfers": {
    "paul-karen": { "toAirport": "", "fromAirport": "" },
    "lance-allison": { "toAirport": "", "fromAirport": "" },
    "leah-brent": { "toAirport": "", "fromAirport": "" },
    "noah-cori": { "toAirport": "", "fromAirport": "" }
  },
  "gettingAround": "",
  "importantNumbers": ""
}
Family ids: paul-karen (Grammy and Papa), lance-allison, leah-brent, noah-cori. Use "all" for things that apply to everyone and "adults" for adults-only activities.
Each flight: { "departureDate": "MM-DD", "airline": "", "flightNumber": "", "departureAirport": "XXX", "departureTime": "", "arrivalAirport": "XXX", "arrivalTime": "" }.
Each accommodation entry: { "checkIn": "MM-DD", "details": "" }.
Each activity: { "activity": "", "date": "MM-DD", "time": "", "dressCode": "", "notes": "" }.
Dates are month-day only in "MM-DD" form (e.g. "07-19").`;

/** Ask Claude and parse the JSON it returns (strips ``` fences if present). */
async function askClaudeJson(content) {
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env and restart the server.');
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content }],
  });
  const text = message.content?.find((b) => b.type === 'text')?.text?.trim();
  if (!text) throw new Error('Empty response from Claude');
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
}

async function handleParse(req, res) {
  try {
    const { pdfBase64 } = req.body || {};
    if (!pdfBase64) return res.status(400).json({ error: 'Missing pdfBase64 in body' });
    const parsed = await askClaudeJson([
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
      { type: 'text', text: `Extract trip information from this PDF. ${TRIP_DATA_SCHEMA}` },
    ]);
    res.json(parsed);
  } catch (e) {
    console.error('Parse request error:', e);
    res.status(500).json({ error: e?.message || 'Parse failed. Check the server terminal for details.' });
  }
}

async function handleOcr(req, res) {
  try {
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64 in body' });
    const parsed = await askClaudeJson([
      { type: 'image', source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: imageBase64 } },
      { type: 'text', text: `Extract trip information from this image. ${TRIP_DATA_SCHEMA}` },
    ]);
    res.json(parsed);
  } catch (e) {
    console.error('OCR request error:', e);
    res.status(500).json({ error: e?.message || 'OCR failed' });
  }
}

async function handleScan(req, res) {
  try {
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64 in body' });
    const parsed = await askClaudeJson([
      { type: 'image', source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: imageBase64 } },
      {
        type: 'text',
        text: `This is a photo of a travel document (booking confirmation, itinerary, ticket, email, etc.).
1. Extract everything you can into "data" using the schema below.
2. In "questions", list up to 5 short, plain-English questions about things you could NOT determine but need to file the data correctly — for example which family or party a booking belongs to, a missing date, time, city, or name. If everything is clear, use an empty list.
Return valid JSON only, no markdown, shaped as: {"data": <schema object>, "questions": ["...", ...]}
The schema for "data": ${TRIP_DATA_SCHEMA}`,
      },
    ]);
    res.json(parsed);
  } catch (e) {
    console.error('Scan request error:', e);
    res.status(500).json({ error: e?.message || 'Scan failed' });
  }
}

async function handleScanRefine(req, res) {
  try {
    const { data, questions, answers } = req.body || {};
    if (!data) return res.status(400).json({ error: 'Missing data in body' });
    const qa = (questions || []).map((q, i) => `Q: ${q}\nA: ${(answers || [])[i] || '(no answer — use your best judgment)'}`).join('\n');
    const parsed = await askClaudeJson([
      {
        type: 'text',
        text: `You previously extracted this trip data from a photographed document:
${JSON.stringify(data)}

You asked the user these questions and got these answers:
${qa}

Apply the answers to the data (move items to the right family/party, fill in dates/times/names, correct anything the answers clarify). Return ONLY the corrected data JSON in the same schema — no wrapper object, no markdown. ${TRIP_DATA_SCHEMA}`,
      },
    ]);
    res.json(parsed);
  } catch (e) {
    console.error('Scan refine error:', e);
    res.status(500).json({ error: e?.message || 'Could not apply the answers' });
  }
}

// Same endpoints with and without /api prefix (Vite dev proxy strips /api)
app.post('/parse', handleParse);
app.post('/api/parse', handleParse);
app.post('/ocr', handleOcr);
app.post('/api/ocr', handleOcr);
app.post('/scan', handleScan);
app.post('/api/scan', handleScan);
app.post('/scan/refine', handleScanRefine);
app.post('/api/scan/refine', handleScanRefine);

app.get('/health', (req, res) => res.json({ ok: true }));

// Serve built web app (for deployment: build with "npm run build" in web-app, then run server)
const WEB_APP_ROOT = path.join(__dirname, '..', 'web-app', 'dist');
if (fs.existsSync(WEB_APP_ROOT)) {
  app.use(express.static(WEB_APP_ROOT, {
    setHeaders: (res, filePath) => {
      // Never cache the HTML shell so a rebuilt app always shows up;
      // hashed JS/CSS assets are safe to cache long-term.
      if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-store');
      else if (/\.(js|css)$/.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }));
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    const p = path.join(WEB_APP_ROOT, req.path);
    if (fs.existsSync(p) && !fs.statSync(p).isDirectory()) return next();
    res.setHeader('Cache-Control', 'no-store');
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
  if (!ANTHROPIC_API_KEY) console.log('Set ANTHROPIC_API_KEY (in .env) for PDF/image import and map suggestions.');
});
