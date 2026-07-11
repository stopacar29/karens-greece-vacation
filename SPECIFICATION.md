# Karen's 70th — Greece Trip Website: Specification

A shared website for planning and enjoying Karen's 70th-birthday family trip, used by the whole family before and during the trip.

**Destinations:** Athens, Santorini, Crete, London, Istanbul, Cappadocia, and Ephesus (plus Vienna/Salzburg on Leah and Brent's itinerary). Destination-specific content — the map, tipping policy, outlets, and phrases — covers all of these.

## Design goals

### 1. Data entered is maintained until intentionally deleted

- Everything typed into the app (flights, hotels, activities, schedule items, notes) is saved automatically — there is no "Save" step to forget.
- Data is stored in two places: the visitor's browser (localStorage, so it survives refreshes and works offline) and the shared server store, so the whole family sees the same information.
- On Netlify, the shared store is **Netlify Blobs**, which persists across deploys and restarts. Nothing is wiped by a redeploy.
- Deleting anything requires an intentional double-tap: every Delete/Remove button asks for a confirming second tap ("Tap again to delete") and disarms itself after a few seconds if the first tap was accidental.
- The Home page keeps manual safety valves: "Export backup (JSON)", "Restore from file", "Sync to server now", and "Load from server".

### 2. Reservations are made for a "party"

Anywhere a reservation, stay, or activity is entered (Activities, Hotel / House, Schedule), it applies to one of these parties:

| Party | Who it includes |
|---|---|
| **Everyone — all 17 of us** | The entire travel party below |
| **Adults only** | The grown-ups (activities only, e.g. an adults' dinner) |
| **Grammy and Papa** | Papa (Paul) and Grammy (Karen — the Birthday Girl) |
| **Lance and Allison's Family** | Lance (son of Paul & Karen), Allison (his wife), sons Cohen, Keane, Rambo, daughter Caroline |
| **Leah and Brent's Family** | Leah (daughter of Paul & Karen), Brent (her husband), son Knox, daughters Lucy and June |
| **Noah and Cori's Family** | Noah (son of Paul & Karen), Cori (his wife), daughter Rhema, son Gideon |

- The roster (17 travelers) is defined in code (`web-app/src/constants/families.ts`) as the single source of truth; saved data cannot silently override the family list, so name corrections always take effect.
- Flights and airport transfers are entered per family (each family flies on its own itinerary).

### 3. Works on everyone's phone (iPhone and Android)

- The site is a responsive web app: nothing to install, no app store — everyone opens the same link in Safari or Chrome on their phone.
- Phone-specific care: inputs use ≥16px text so iPhones don't auto-zoom, buttons and nav links are comfortable touch targets (≥40px), the layout adapts below 600px, and the site can be added to the home screen like an app (Add to Home Screen).

### 4. As friendly as possible

- Plain-language labels and hints on every page (e.g. "Everyone — all 17 of us" instead of a bare "All").
- Nothing is lost by mistake: automatic saving, confirm-before-delete, offline tolerance.
- The Schedule assembles itself from what's entered elsewhere (flights, check-ins, activities) so nobody has to enter anything twice.
- Friendly extras for the trip: Family Gallery photo sharing, interactive map with AI suggestions, travel information (tipping, outlets, currency, Greek and Turkish phrases).
- The Guests page lists names only — the family knows who everyone is.
- The trip map uses an English-labeled basemap (Esri World Street Map) and opens zoomed to show every stop from London to Cappadocia.

### 5. Hosting: Netlify

- The site is published on **Netlify** (`netlify.toml` at the repo root) — no other hosting is needed.
- The React app (`web-app/`) is built and served as a static site; `/api/trip` and `/api/gallery` run as **Netlify Functions** backed by **Netlify Blobs** for persistent shared storage. This keeps everything on one free-tier platform and satisfies design goal #1 (a redeploy never erases data).
- The AI features also run as a Netlify Function (`ai.mts`): **Import** sends PDFs/photos directly to Claude for extraction, and the **Map** gets its suggestions from Claude. Everything uses one `ANTHROPIC_API_KEY`, set in the Netlify dashboard (Site settings → Environment variables). No OpenAI key, no Render server — the former Render deployment (`render.yaml`) is retired.

## Architecture

- **`web-app/`** — React + TypeScript + Vite single-page app (the website).
- **`web-app/netlify/functions/`** — Netlify Functions: `trip.mts` (GET/PUT `/api/trip`), `gallery.mts` (list/upload/serve photos), storage in Netlify Blobs.
- **`server/`** — Express server used for local development (and optional Render deployment). Serves the same `/api` endpoints from files on disk, plus PDF import and AI suggestions.
- **`app/`, `components/`, `constants/` (root)** — earlier Expo (React Native) version, kept for reference; the web app is the primary product.

## Data model (shared trip data)

One JSON document (`TripData`) holds: trip start/end dates, flights per family (max 10), accommodation entries per party (max 10, with check-in dates), activities per party (name, date, time, dress code, notes), airport transfers per family, day-by-day schedule items, getting-around notes, and important numbers. See `web-app/src/types/trip.ts`.

## Running locally

```bash
./run-local.sh        # builds the web app and starts everything at http://localhost:3000
```

Or for live-reload development:

```bash
cd server && npm install && npm start      # terminal 1 — API on :3000
cd web-app && npm install && npm run dev   # terminal 2 — site on http://localhost:5173
```
