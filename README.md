# Karen's Greece 70th — Family Vacation App

A simple app to manage your family vacation (Santorini & Crete) for Karen's 70th birthday. Runs on **Android** and **iPhone** from one codebase.

## Try the app (first version)

1. **Install Node.js** from [nodejs.org](https://nodejs.org) (LTS) if you don’t have it.
2. In a terminal:
   ```bash
   cd karens-greece-vacation
   npm install
   npx expo start
   ```
3. On your phone: install **Expo Go** (App Store / Play Store), connect to the same Wi‑Fi as your computer, then **scan the QR code** from the terminal. The app opens in Expo Go.

See **RUN_FIRST.md** for a short step-by-step.

## Web app (recommended for Import)

A **browser version** of the app lives in **`web-app/`**. It’s often easier for **Import**: paste or choose a PDF or image and the app fills trip data — no phone, no QR code, no “same WiFi.”

1. Start the backend: `cd server && npm install && npm start`
2. Start the web app: `cd web-app && npm install && npm run dev`
3. Open **http://localhost:5173**

See **web-app/README.md** for details.

## What's in the app

- **Home** — Welcome and quick links
- **Schedule** — Trip timeline (arrival, birthday day, excursions, departure)
- **Travel** — Flights, accommodation, transfers, important numbers
- **Guests** — Who’s coming (by family)
- **Import** — Update the app from PDFs (flights, accommodation, transfers, schedule)

You can type or paste details into the app, or **give it PDFs** and have it update itself using the parser server (see below).

## Run the app

### 1. Install Node.js

If you don’t have it: install from [nodejs.org](https://nodejs.org) (LTS).

### 2. Install dependencies

```bash
cd karens-greece-vacation
npm install
```

### 3. Start the dev server

```bash
npx expo start
```

### 4. Open on your phone

- **iPhone:** Install “Expo Go” from the App Store. Scan the QR code from the terminal or browser.
- **Android:** Install “Expo Go” from the Play Store. Scan the QR code.

Use the same Wi‑Fi on your computer and phone so they can connect.

## Updating the app from PDFs

You can send the app PDFs (e.g. booking confirmations, itineraries) and have it fill in Schedule and Travel automatically.

1. **Run the parser server** (on your computer or a host):

   ```bash
   cd server
   npm install
   export OPENAI_API_KEY=sk-...   # optional but recommended
   npm start
   ```

2. In the app, open the **Import** tab, set the server URL (on a phone use your computer’s IP, e.g. `http://192.168.1.5:3000`), then tap **Choose PDF and import**.

3. The server extracts text from the PDF and (with an API key) uses AI to map it to flights, accommodation, airport transfers, and schedule. The app merges the result and persists it locally.

See **server/README.md** for details and deployment.

## App icon (optional)

To set a custom icon:

1. Add `icon.png` (1024×1024) and `adaptive-icon.png` (1024×1024) in the `assets/` folder.
2. If you don’t add them, remove or comment out the `"icon"` line in `app.json` so the project still runs (Expo will use a default).

## Building installable apps (optional)

For a standalone app you can install without Expo Go:

- **iOS:** Use [EAS Build](https://docs.expo.dev/build/introduction/) (requires an Apple Developer account for distribution).
- **Android:** Use EAS Build to produce an `.apk` or `.aab` for the Play Store or sideloading.

```bash
npm install -g eas-cli
eas build --platform all
```

## Tech

- [Expo](https://expo.dev) (React Native)
- TypeScript
- Expo Router (tabs and navigation)

Enjoy the trip and happy 70th to Karen.
