# "Could not connect to the development server"

If you see this even though you ran `npx expo start` and your phone is on the same Wi‑Fi, try these in order:

## 1. Grant Local Network access to Expo Go (phones)

- **iPhone:** Settings → Expo Go → turn **Local Network** **On**.
- **Android:** Settings → Apps → Expo Go → Permissions → allow **Nearby devices** (or similar) if shown.

This is the most common fix when both devices are on the same network.

## 2. Use tunnel mode

Tunnel mode works even when the same Wi‑Fi fails (e.g. firewall, router, or guest network).

**If you see "Failed to install @expo/ngrok globally":** the project includes `@expo/ngrok` as a dev dependency. If `npm install` is already done (or you see `node_modules/@expo/ngrok`), you can start the tunnel without waiting. If install is **stuck or very slow**, press **Ctrl+C** to stop it, then try:

```bash
npm install --prefer-offline --no-audit --no-fund
```

If that still hangs, try starting the tunnel anyway (ngrok may already be installed):

```bash
npx expo start --tunnel
```

Or:

```bash
npm run start:tunnel
```

Then scan the **new** QR code in Expo Go. The first load may be slower.

**If you see `CommandError: TypeError: Cannot read properties of undefined (reading 'body')`** when running tunnel: this is a known Expo/ngrok bug. Use **LAN mode** instead: run `npm start` (no tunnel), enable **Local Network** for Expo Go (step 1 above), keep phone and Mac on the same Wi‑Fi, then scan the QR code.

## 3. Same Wi‑Fi and no VPN

- Phone and computer must be on the **same** Wi‑Fi network.
- Avoid guest networks.
- Turn off VPN on the phone (and try without VPN on the computer) while connecting.

## 4. Clear Expo cache and restart

```bash
rm -rf .expo
npx expo start
```

## 5. Firewall

On your computer, allow Node/Expo through the firewall:

- **macOS:** System Settings → Network → Firewall → Options → add Terminal (or Node) and allow incoming.
