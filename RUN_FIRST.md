# Try the app — first version

Do this once to run the app on your phone or simulator.

## 1. Install Node.js (if needed)

- Download the **LTS** version from [nodejs.org](https://nodejs.org) and install it.
- Restart your terminal after installing.

## 2. Install dependencies and start

In a terminal:

```bash
cd "/Users/PaulStaudacher/Documents/Cursor Claude/karens-greece-vacation"
npm install
npx expo start
```

## 3. Open the app

- **On your iPhone or Android phone:**  
  - Install **Expo Go** from the App Store (iPhone) or Play Store (Android).  
  - Make sure your phone is on the **same Wi‑Fi** as your computer.  
  - Scan the **QR code** shown in the terminal (or in the browser window that opened).  
  - The app will load in Expo Go.

- **On your computer (simulator):**  
  - In the terminal where `expo start` is running, press **`i`** for iOS simulator or **`a`** for Android emulator (if you have them installed).

- **If you see "Could not connect to the development server":** see **CONNECTION_TROUBLESHOOTING.md** (try tunnel: `npx expo start --tunnel` or `npm run start:tunnel`, and enable Local Network for Expo Go in phone Settings).

---

That’s it. You should see the Santorini hero and the tabs: Home, Schedule, Travel, Guests, Import.  
For a standalone installable build (no Expo Go), see the main **README.md** section “Building installable apps”.
