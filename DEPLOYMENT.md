# Deploy so family can open one URL

Trip data is stored on the server (`server/data/trip.json`). Once deployed, everyone uses the **same URL** and sees the same data.

**→ For a step-by-step, copy-paste deploy with data + pictures saved and low cost, see [FAMILY-DEPLOY.md](./FAMILY-DEPLOY.md).**

---

## Option 1: Deploy to Render (one URL, ~5 minutes)

Render’s free tier gives you a URL like **https://karens-greece-trip.onrender.com** so family can open it in a browser with no setup.

### Steps

1. **Push this project to GitHub** (if it isn’t already).
   - Create a repo at https://github.com/new and push your code.

2. **Sign up at https://render.com** (free account).

3. **Create a Web Service**
   - Dashboard → **New +** → **Web Service**.
   - Connect your **GitHub** account and select the repo that contains this project.
   - Render will detect the `render.yaml` in the repo and use it. If it doesn’t, set:
     - **Build command:**  
       `cd web-app && npm ci && npm run build && cd ../server && npm ci`
     - **Start command:**  
       `cd server && node index.js`
   - Click **Create Web Service**.

4. **Wait for the first deploy** (a few minutes). When it’s done, open the URL Render shows (e.g. `https://karens-greece-trip.onrender.com`).

5. **Share that URL** with family. They can open it on any device and use the app.

### Optional: PDF/OCR import

To use **Import** with PDFs/images, add your OpenAI key in Render:

- Your service → **Environment** → **Add Environment Variable**
- Key: `OPENAI_API_KEY`, Value: your key → **Save**.  
Render will redeploy; after that, Import will work.

### Note about free tier

- The app URL may “spin up” after a short idle; the first open can take 30–60 seconds.
- **Data persistence:** On the free tier, the server’s disk is **ephemeral** — trip data and gallery photos can be lost when the service restarts or redeploys. To keep data across restarts, use a **persistent disk** (see below).

### Keeping data across restarts (persistent disk on Render)

1. In the Render dashboard, open your **Web Service**.
2. Go to **Settings** → **Disks** (or **Add Disk**).
3. Add a disk, e.g. **Mount Path:** `/data` or `/opt/data` (use whatever path Render shows), **Size:** 1 GB.
4. Add an **Environment Variable**: **Key** `DATA_DIR`, **Value** the same as the mount path (e.g. `/data` or `/opt/data`).
5. Redeploy. Trip data and gallery uploads will then be stored on the disk and survive restarts and redeploys.

---

## Option 2: Run on your computer (same Wi‑Fi)

1. **Build and start**
   ```bash
   npm run serve
   ```
2. Open **http://localhost:3000** on your machine.
3. On the same Wi‑Fi, others can use **http://YOUR_IP:3000** (e.g. `http://192.168.1.10:3000`). Find your IP in System Settings → Network.

---

## Option 3: Other hosts (Railway, Fly.io, etc.)

- **Build:** Install and build the web app, then install server deps, e.g.  
  `cd web-app && npm ci && npm run build && cd ../server && npm ci`
- **Start:** Run the server from repo root context so it can see `web-app/dist` and `server/data`, e.g.  
  `cd server && node index.js`
- Set **OPENAI_API_KEY** in the host’s environment if you want PDF/OCR import.

---

## Checklist before sharing the URL

- [ ] Deploy finished and the app URL opens.
- [ ] You can add a flight or activity and refresh — data is still there.
- [ ] (Optional) OPENAI_API_KEY set in the host if you use Import.
