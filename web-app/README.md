# Karen's Greece 70th — Web App

This is the **web version** of the trip app. Use it in the browser for schedule, travel, guests, and **Import** (paste or choose PDF/images to fill trip data).

## Run locally

1. **Start the backend** (for PDF and image import):

   ```bash
   cd ../server
   npm install
   npm start
   ```

   Leave it running. Set `OPENAI_API_KEY` for best results.

2. **Start the web app** (in another terminal):

   ```bash
   cd web-app
   npm install
   npm run dev
   ```

3. Open **http://localhost:5173** in your browser.

The dev server proxies `/api/*` to the backend on port 3000, so Import works without any URL setup.

## Import (web)

- **Choose file**: Pick a PDF or image (JPEG/PNG). The app sends it to the backend; the backend extracts text and returns trip data.
- **Paste**: Focus the text area and paste (Ctrl+V / Cmd+V). If you paste an **image or PDF** from the clipboard, the app will process it the same way. If you paste **text**, click "Import pasted text" to run a simple extraction (dates, flight-like lines).

No phone, no QR code, no "same WiFi" — just open the URL and use Import.

## Build for production

```bash
npm run build
```

The output is in `dist/`. You can serve it with any static host or mount it under the Node server (see server README).
