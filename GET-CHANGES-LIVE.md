# Why your changes don’t show (and how to fix it)

The code in your project is correct: one “Print Schedule” button, no “Save & sync data” on the front page, and the new Family Gallery text. If you still see the old version, it’s usually one of the following.

---

## 1. Rebuild so the built files are up to date

The live app and the server use the **built** files in `web-app/dist/`, not the source in `web-app/src/`. If you haven’t run the build after your changes, `dist` is still old.

**Run this in Terminal (copy and paste):**

```bash
cd "/Users/PaulStaudacher/Documents/Cursor Claude/karens-greece-vacation"
npm install --prefix web-app && npm run build --prefix web-app && npm install --prefix server
```

---

## 2. If you’re testing on the live site (e.g. Render)

The site only updates after you **deploy** a new build. Pushing code to GitHub is not enough by itself: Render must run a new **build** and **deploy**.

**Do this in order:**

1. **Commit and push** (so GitHub has your latest code):
   ```bash
   cd "/Users/PaulStaudacher/Documents/Cursor Claude/karens-greece-vacation"
   git add -A
   git status
   ```
   If you see changed files:
   ```bash
   git commit -m "Single Print button, no Sync section, gallery wording, hero fix"
   git push origin main
   ```

2. **Trigger a new deploy on Render**
   - Open https://dashboard.render.com
   - Open your **Web Service** (e.g. karens-greece-trip)
   - Click **Manual Deploy** → **Deploy latest commit**
   - Wait until the build and deploy finish (status “Live”)

3. **Optional: clear Render’s build cache** (if you’ve pushed before and still see old UI)
   - In the same service, go to **Settings**
   - Find **Build & Deploy** (or similar)
   - Use **Clear build cache** if available, then run **Manual Deploy** again

4. **Hard refresh in the browser** so you don’t see an old cached page:
   - **Mac:** `Cmd + Shift + R` (Chrome/Safari/Firefox)
   - **Windows:** `Ctrl + Shift + R`
   - Or open the site in a private/incognito window

---

## 3. If you’re testing locally

- Restart the dev server (or the server that serves `web-app/dist`) after running the build in step 1.
- Then do a hard refresh (`Cmd + Shift + R` or `Ctrl + Shift + R`) on http://localhost:5173 (or whatever URL you use).

---

## Quick checklist

- [ ] Ran the **build** command above (so `web-app/dist` is new).
- [ ] **Committed and pushed** to GitHub (if you want the live site updated).
- [ ] **Deployed** on Render (Manual Deploy → Deploy latest commit).
- [ ] **Hard refresh** (or incognito) when opening the site.

After that, you should see: one “Print Schedule” button on the Schedule page, no “Save & sync data” on the front page, and the new Family Gallery text.
