# Deploy for family (one URL, data + pictures saved, low cost)

Use this to get a single link your family can use, with **trip data and gallery photos saved** and at **low cost** (free web service + about **$0.25/month** for 1 GB storage).

---

## Part 1: Push your code to GitHub

In **Terminal** on your Mac, run these one at a time (copy and paste):

```bash
cd "/Users/PaulStaudacher/Documents/Cursor Claude/karens-greece-vacation"
```

```bash
git add -A && git status
```

If you see files to commit:

```bash
git commit -m "Deploy: schedule print, phrases phonetics, gallery persistence, image serving"
```

```bash
git push origin main
```

(Use your GitHub login or token if prompted.)

---

## Part 2: Create the app on Render (first time only)

1. Go to **https://dashboard.render.com** and sign in (or create a free account).
2. Click **New +** → **Web Service**.
3. Connect **GitHub** if needed, then select the repo: **karens-greece-vacation** (or whatever you named it).
4. Render may read `render.yaml` from the repo. If it does, the build and start commands are already set. If not, set them manually:
   - **Build command:**  
     `npm install --prefix web-app && npm run build --prefix web-app && npm install --prefix server`
   - **Start command:**  
     `cd server && node index.js`
5. **Instance type:** leave **Free**.
6. Click **Create Web Service** and wait for the first deploy. When it’s done, you’ll get a URL like `https://karens-greece-trip.onrender.com`. Open it to confirm the app loads.

---

## Part 3: Add storage so data and pictures are saved

Without this, trip data and gallery photos can be lost when the app restarts or redeploys.

1. In the Render dashboard, open your **Web Service** (e.g. karens-greece-trip).
2. Go to the **Disks** tab (or **Settings** → **Disks**).
3. Click **Add Disk**:
   - **Name:** `data` (or any name).
   - **Mount Path:** `data`  
     Type exactly: `/data`
   - **Size:** `1` GB (enough for trip data and many family photos; about **$0.25/month**).
4. Click **Save** (or **Add**).
5. Go to **Environment** (or **Environment Variables**).
6. Add a variable:
   - **Key:** `DATA_DIR`
   - **Value:** `/data`
7. Click **Save Changes**. Render will redeploy the service.

After the redeploy, trip data and gallery uploads are stored on the disk and **persist** across restarts and new deploys.

---

## Part 4: Share the URL with family

- Your app URL is something like: **https://karens-greece-trip.onrender.com**
- Share this link. Everyone can open it on a phone, tablet, or computer—no install.

**Cost summary**

- **Web service:** Free (Render free tier).
- **Storage:** About **$0.25/month** for 1 GB (trip data + gallery photos). You can increase size later if needed.

---

## If you already have a Render service

- **Part 1:** Push latest code (`git add -A`, `git commit -m "..."`, `git push origin main`).
- **Part 3:** Add the disk (Mount Path: `/data`, 1 GB) and env var `DATA_DIR=/data`, then let it redeploy.

---

## Optional: PDF/OCR import

If you want to use **Import** with PDFs or images:

- In Render: your service → **Environment** → **Add Environment Variable**
- **Key:** `OPENAI_API_KEY`  
- **Value:** your OpenAI API key  
- Save (Render will redeploy). Import will then work.

---

## Checklist

- [ ] Code pushed to GitHub (`git push origin main`).
- [ ] Web Service created on Render and first deploy succeeded.
- [ ] Disk added: Mount Path `/data`, 1 GB.
- [ ] Environment variable `DATA_DIR` = `/data` set.
- [ ] Redeploy finished; app URL opens.
- [ ] You added a flight or photo and refreshed; data is still there.
- [ ] URL shared with family.
