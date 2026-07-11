# Deployment — Netlify (everything in one place)

The site deploys entirely to **Netlify**: static site + Functions (trip data, gallery, AI) + Blobs storage. No Render, no OpenAI — one `ANTHROPIC_API_KEY` powers PDF/photo import and map suggestions.

> The old Render deployment (`render.yaml`) is retired. These steps replace it (and the older FAMILY-DEPLOY.md / HOSTING-VENDORS.md guides).

## One-time setup

1. **Push the repo to GitHub** (private repo is fine).
2. **Create the Netlify site**: at [app.netlify.com](https://app.netlify.com) → *Add new site* → *Import an existing project* → pick the GitHub repo. All build settings come from `netlify.toml` automatically (base `web-app`, publish `dist`, functions `web-app/netlify/functions`).
3. **Add the API key**: Site settings → *Environment variables* → add `ANTHROPIC_API_KEY` with your key (same value as in your local `.env`).
4. **Deploy** — Netlify builds and gives you a URL like `https://karens-70th.netlify.app`. You can rename the site for a nicer URL.

## Seed the data (first deploy only)

The production store starts empty. On your Mac with the app running locally (`./run-local.sh`):

1. Open http://localhost:3000, go to **Home → Export backup (JSON)** and save the file.
2. Open the new Netlify URL, go to **Home → Restore from file**, and choose that backup.

That writes everything into Netlify Blobs and every family member sees it from then on.

## Where production data lives

- Trip data: Netlify Blobs, store `karens-trip` (written by the `/api/trip` function).
- Photos: Netlify Blobs, store `karens-gallery`.
- Each visitor's browser also keeps a localStorage copy for offline use.
- Data persists across every deploy and restart — it only changes when someone edits it (design goal #1).

## Updating the live site

Push to the GitHub repo's main branch — Netlify rebuilds and deploys automatically. Data is untouched by deploys.

## Local development

`./run-local.sh` (or `server` + `web-app` dev servers separately, see README). Locally, data lives in `server/data/` on your Mac; the same `ANTHROPIC_API_KEY` in `.env` powers the AI features.
