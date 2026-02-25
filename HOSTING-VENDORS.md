# Choosing a vendor for permanent production

You need one URL for the family, with **trip data and gallery photos persisted**, at **low cost**. The app is a **Node.js (Express) server** that serves the built React app and writes **trip.json** and **gallery images** to disk.

---

## What your app needs

- **Runtime:** Node.js (Express).
- **Build:** `npm install --prefix web-app && npm run build --prefix web-app && npm install --prefix server`.
- **Start:** `cd server && node index.js`.
- **Storage:** Persistent disk (or equivalent) for `DATA_DIR` so `trip.json` and `gallery/` survive restarts and redeploys.
- **Cost:** Inexpensive (family use, low traffic).

---

## Vendor comparison (short list)

| Vendor | Best for | Persistent storage | Rough cost (app + storage) | Notes |
|--------|----------|--------------------|----------------------------|--------|
| **Render** | Easiest if you’re already there | Yes: add disk, set `DATA_DIR` | **Catch:** Disks are only for *paid* services. If your dashboard only offers \$0 vs \$19 (e.g. workspace plan), adding a disk can mean jumping to \$19/mo. Some accounts see a \$7 “Starter” instance tier + disk; if so, ~\$7/mo + \$0.25/GB. | Free tier = no disk (ephemeral). Check your plan/instance options. |
| **Railway** | Simple, usage-based | Yes: volumes | ~\$5–10/mo typical for low traffic + small volume | Easy Node deploy. Pay for compute + volume. No free tier for persistent storage long-term. |
| **Fly.io** | Global, more control | Yes: volumes | Free tier small; paid ~\$5+/mo with volume | Good docs. Slightly more config (Dockerfile or fly.toml). |
| **DigitalOcean App Platform** | Predictable monthly price | Yes: add-on persistent storage | ~\$5/mo (basic app) + storage add-on | Fixed pricing, straightforward. No free tier. |

---

## Recommendation

- **Stay on Render for production**  
  You already have the app there. For a “permanent” setup:
  1. Add a **persistent disk** (e.g. 1 GB, mount path `/data`).
  2. Set **`DATA_DIR=/data`** in the service environment.
  3. Optionally move off the free tier to a **Starter** instance (~\$7/mo) if you want no spin-down and faster cold starts.

- **If you prefer to switch vendors**
  - **Railway** or **DigitalOcean App Platform** are the next simplest: both support Node, persistent storage, and give you one URL. Use the same build/start commands and `DATA_DIR` as in your current setup.

---

## Best value for this app and similar test apps

| Scenario | Best value choice | Why |
|----------|-------------------|-----|
| **Only this app (one URL, low traffic)** | **Render** | Free-tier web service + small persistent disk (~\$0.25/mo for 1 GB) = **lowest cost**. You’re already set up; add disk + `DATA_DIR` and you’re done. |
| **This app + several other small/test apps** | **Railway** | One account, **usage-based billing**: you pay for compute + storage across all projects. One production app plus 2–3 small test apps often stays in the **\$5–15/mo** range instead of paying per app (e.g. \$7 × 3 on Render). Good if you want to host multiple similar Node/Express or static apps without managing multiple platforms. |
| **Predictable monthly bill, one app** | **DigitalOcean App Platform** | Fixed **~\$5/mo** (basic app) + storage. No free tier, but no surprises. |
| **You like the terminal and want multiple small apps** | **Fly.io** | Free tier can run a few tiny apps; after that pay per VM + volume. Good if you’re comfortable with CLI and want one place for many small projects. |

**Summary:** If **Render** shows only \$0 vs \$19 with nothing in between (and adding a disk forces the \$19 tier), then **Railway is the better value** for this app and for running other test projects: one account, usage-based billing, persistent volumes without a big plan jump, and one bill for everything. If your Render account does offer a \$7 Starter instance plus disk (~\$7 + storage), that can be the cheapest single-app option; otherwise prefer Railway.

---

## Custom domain (your own domain)

**All of the vendors above support your own domain** (e.g. `trip.yourfamily.com` or `karensgreece.com`):

| Vendor | Custom domain | SSL (HTTPS) |
|--------|----------------|------------|
| **Render** | Yes: add in dashboard (Settings → Custom Domains). Point your DNS (CNAME or A) to the host they show. | Automatic (managed TLS, HTTP → HTTPS). |
| **Railway** | Yes: add in project settings; they give you a CNAME target. | Automatic. |
| **DigitalOcean App Platform** | Yes: add in app settings; use their CNAME. | Automatic. |
| **Fly.io** | Yes: e.g. `fly certs add yourdomain.com`, then set DNS as shown. | Automatic after you add the cert. |

You add your domain in the vendor’s dashboard (or CLI for Fly), then at your **domain registrar or DNS provider** you add a **CNAME** record pointing to the hostname they give you. After DNS propagates, the vendor issues/renews the certificate and your app is served on your domain over HTTPS.

---

## Checklist for “permanent production” on any vendor

- [ ] Persistent storage attached and used for app data (e.g. `DATA_DIR` pointing at it).
- [ ] Build and start commands set correctly (see [FAMILY-DEPLOY.md](./FAMILY-DEPLOY.md) or [DEPLOYMENT.md](./DEPLOYMENT.md)).
- [ ] One public URL to share with family (HTTPS).
- [ ] Optional: custom domain added and DNS pointed (CNAME to vendor).
- [ ] Optional: paid tier if you want no sleep/cold starts (e.g. Render Starter, or equivalent on Railway/DO/Fly).
