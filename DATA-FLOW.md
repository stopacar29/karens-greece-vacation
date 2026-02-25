# Runtime data flow: how data is saved and loaded

This describes the **whole runtime environment process** for saving and loading data in the Karen’s Greece vacation app.

---

## 1. Two kinds of data

| Data | Where it lives (runtime) | Who writes it |
|------|--------------------------|----------------|
| **Trip data** (flights, hotels, activities, schedule, etc.) | Browser **localStorage** + server file **trip.json** | React app (TripContext) + Express server |
| **Gallery photos** | Server directory **gallery/** (image files only) | Express server (multer); browser only uploads |

Trip data is **synced** between browser and server. Gallery photos are **only on the server** (no local copy).

---

## 2. Server storage (where the server keeps files)

- The server uses a **data directory**:
  - **Default:** `server/data/` (relative to the server process).
  - **With env:** If `DATA_DIR` is set (e.g. `DATA_DIR=/data` on Render), that path is used instead.
- Inside that directory:
  - **`trip.json`** – single JSON file with all trip data (flights, accommodation, activities, etc.).
  - **`gallery/`** – folder of image files (e.g. `1735123456789-abc12def.jpg`).
- On **Render free tier** without a persistent disk, this directory is **ephemeral**: it is wiped on restart/redeploy. To keep data and photos, add a **persistent disk**, mount it (e.g. at `/data`), and set **`DATA_DIR=/data`**.

---

## 3. Trip data: full runtime process

### 3.1 Where trip state lives in the browser

- **Single source of truth in memory:** React state inside `TripContext` (`tripData`).
- **Backup in the browser:** Every time `tripData` changes, it is written to **localStorage** under the key `karens_greece_trip` (so it survives refresh and works offline).

### 3.2 When the app loads (page load or refresh)

1. **Initial state**
   - `TripContext` runs: it reads **localStorage** (`karens_greece_trip`).
   - If something is there, it parses the JSON and merges it into a default structure → that becomes the initial `tripData`.
   - If nothing is there (or parse fails), initial `tripData` is the default empty structure.

2. **Fetch from server**
   - Right after mount, the app calls **GET `/api/trip`** (relative URL, so same origin as the deployed site).
   - Server behavior:
     - If **`trip.json` exists:** reads it, returns its JSON.
     - If **`trip.json` does not exist:** returns `200` with `{}` (empty object).
   - Client: if the response is valid JSON (and not an error payload), it **merges** that into the current state: `mergeParsedIntoState(prev, parsed)`. So server data overlays/combines with what was in localStorage. Result is the “loaded” trip data everyone shares when they use the same URL.

3. **After going back online**
   - The app listens for the browser **`online`** event and runs the same **GET `/api/trip`** + merge again, so after connectivity returns it resyncs with the server.

### 3.3 When the user changes trip data (edit flight, activity, etc.)

1. **Update state**
   - Some UI calls `updateTrip(partial)` (or similar). That updates React state: `setTripData(prev => ({ ...prev, ...partial }))`.

2. **Write to localStorage**
   - A `useEffect` depends on `tripData`. Whenever `tripData` changes, it does:
     - `localStorage.setItem(STORAGE_KEY, JSON.stringify(tripData))`.
   - So **every change is immediately persisted locally** (and works offline).

3. **Send to server (debounced)**
   - Another `useEffect` also depends on `tripData`. It starts a **300 ms** debounce timer.
   - When the timer fires, it sends **PUT `/api/trip`** with `body: JSON.stringify(tripData)`.
   - Server: receives the JSON body, calls `writeTripData(data)`, which **overwrites** `trip.json` (in `DATA_DIR` or `server/data`) with the new full object.
   - So **shortly after each change**, the server file is updated. Other devices that load the app will get this data via **GET `/api/trip`** on their next load (or when they click “Load from server”).

### 3.4 Manual sync actions (Home page)

- **“Sync to server now”**  
  Calls `saveToServer()`: sends **PUT `/api/trip`** with the **current** `tripData` (same as the debounced save, but immediate). Same server behavior: overwrite `trip.json`.

- **“Load from server”**  
  Calls `loadFromServer()`: **GET `/api/trip`**, then merges the response into state (and thus into localStorage on next render).

- **“Export backup (JSON)”**  
  Downloads the **current** `tripData` from memory as a JSON file. No server call.

- **“Restore from file”**  
  User picks a JSON file. App parses it, merges into state with `mergeFromImport(parsed)`, then **PUT `/api/trip`** with that parsed object so the server is updated too.

So for **trip data**, the runtime process is: **in-memory state → localStorage on every change → debounced PUT to server → server writes `trip.json`**. On load: **localStorage + GET /api/trip → merge → state**.

---

## 4. Gallery photos: full runtime process

- Photos are **not** stored in React state or localStorage. Only the **list of image URLs** is kept in component state after **GET `/api/gallery`**.

### 4.1 Listing photos (when the Family Gallery page loads)

1. **GET `/api/gallery`**
   - Server: ensures `GALLERY_DIR` exists (`DATA_DIR/gallery` or `server/data/gallery`), then `fs.readdirSync(GALLERY_DIR)`, filters to image extensions, returns `{ images: [ { url: '/api/gallery/images/...' }, ... ] }`.
2. **Client:** stores that list in state and renders each image via the `url` (same origin).

### 4.2 Viewing a single photo

- Each image is an `<img src={item.url} />` where `item.url` is e.g. `/api/gallery/images/1735123456789-abc12def.jpg`.
- Browser requests **GET `/api/gallery/images/:filename`**.
- Server: resolves the file under `GALLERY_DIR`, checks extension, sets `Content-Type`, and **sends the file** with `res.sendFile(filePath)`. No DB; the file itself is the storage.

### 4.3 Uploading a photo

1. User selects a file; the app sends **POST `/api/gallery/upload`** with **multipart/form-data** (field name `photo`).
2. Server uses **multer** with `diskStorage`:
   - Ensures `GALLERY_DIR` exists.
   - Saves the file **on disk** in `GALLERY_DIR` with a generated name like `{timestamp}-{random}.{ext}` (e.g. `.jpg`).
3. Server responds with `{ url: '/api/gallery/images/<filename>' }`.
4. Client adds that `url` to the top of the images list in state so the new photo appears without a full page reload.

So for **gallery**, the runtime process is: **upload → server writes file under `DATA_DIR/gallery`**; **list → server reads directory and returns URLs**; **display → GET `/api/gallery/images/:filename` → server sends file**. All persistence is on the server filesystem (and only persistent if `DATA_DIR` is on a persistent disk).

---

## 5. Request flow summary (deployed app)

- User opens **https://your-app.onrender.com** (or similar). The browser loads the **single-page app** (HTML/JS/CSS) from the same origin (server serves `web-app/dist`).
- All API calls are **same-origin**: `/api/trip`, `/api/gallery`, `/api/gallery/upload`, `/api/gallery/images/...`. So the browser sends cookies/same-origin and no CORS issues for same-origin.
- **Trip:**  
  Load: **localStorage** + **GET /api/trip** → merge → state.  
  Save: state → **localStorage** (every change) + **PUT /api/trip** (debounced 300 ms and on “Sync to server now”).
- **Gallery:**  
  List: **GET /api/gallery** → list of URLs in state.  
  View: **GET /api/gallery/images/:filename** → image bytes from disk.  
  Upload: **POST /api/gallery/upload** → server writes file to `GALLERY_DIR`.

---

## 6. Summary table

| Step | Trip data | Gallery |
|------|-----------|--------|
| **Stored where (server)** | `DATA_DIR/trip.json` (or `server/data/trip.json`) | `DATA_DIR/gallery/*.jpg` etc. |
| **Stored where (browser)** | localStorage key `karens_greece_trip` | Not stored; only list of URLs in memory |
| **Load path** | localStorage → state; then GET /api/trip → merge into state | GET /api/gallery → state; images via GET /api/gallery/images/:id |
| **Save path** | State change → localStorage (immediate) + PUT /api/trip (debounced) | POST /api/gallery/upload → server writes file |
| **Persists across restarts** | Yes if server uses persistent disk for `DATA_DIR` | Yes if server uses persistent disk for `DATA_DIR` |

So the **whole runtime environment process for saving data** is: **browser state + localStorage (trip only)** and **server files (`trip.json` + `gallery/`)** with **GET/PUT /api/trip** and **GET/POST /api/gallery** and **GET /api/gallery/images/:filename** tying them together.
