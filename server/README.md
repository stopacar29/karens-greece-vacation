# PDF Parser for Karen's Greece App

The app can update itself from PDFs by sending them to this server. The server extracts text from the PDF and (with an OpenAI API key) converts it into structured trip data (flights, accommodation, transfers, schedule, etc.).

## Quick start

```bash
cd server
npm install
npm start
```

The server runs at **http://localhost:3000**.  
On a phone, use your computer’s LAN IP instead (e.g. **http://192.168.1.5:3000**) and set that URL in the app’s **Import** tab.

In the app's **Import** tab you can set **PDF server URL** (saved on device). Use your Mac's IP, e.g. `http://192.168.1.5:3000`. Find it: System Settings → Network → Wi‑Fi → Details, or `ipconfig getifaddr en0` in Terminal.

## Automatic extraction (recommended)

Set your OpenAI API key so the server can parse arbitrary PDFs into the app’s data format:

```bash
export OPENAI_API_KEY=sk-...
npm start
```

Then in the app: **Import** → choose a PDF. The server will extract text, send it to OpenAI with a structured prompt, and return JSON. The app merges that into Schedule and Travel.

## Without an API key

If you don’t set `OPENAI_API_KEY`, the server still accepts PDFs and extracts text, but it returns empty trip data and a message that the key is required. Useful to confirm the server and app are talking.

## Endpoints

- **POST /parse** — Body: `{ "pdfBase64": "<base64 string>", "fileName": "optional.pdf" }`. Returns trip data JSON (partial is OK).
- **POST /ocr** — Body: `{ "imageBase64": "<base64 string>", "mimeType": "image/jpeg" }`. Extracts text from the image (requires OPENAI_API_KEY), then returns trip data JSON. Used for pasted or chosen JPEG/PNG.
- **GET /health** — Returns `{ "ok": true }`.

## Deploying

You can run this on any Node host (Railway, Render, Fly.io, etc.). Set `OPENAI_API_KEY` in the environment and set `EXPO_PUBLIC_PDF_PARSER_URL` (or the URL field in the app) to your server’s URL.
