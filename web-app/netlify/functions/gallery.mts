import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';

/**
 * Family Gallery API on Netlify.
 * - GET    /api/gallery                          -> { images: [{ url, caption? }] } (newest first)
 * - POST   /api/gallery/upload                   -> multipart form field "photo"
 * - GET    /api/gallery/images/:filename         -> the image bytes
 * - DELETE /api/gallery/images/:filename         -> remove one photo (explicit,
 *   user-confirmed single-photo deletes only — never bulk wipes; see
 *   .cursor/rules/preserve-trip-data.mdc)
 * - PUT    /api/gallery/images/:filename/caption -> { caption } set/edit the
 *   comment shown under a photo
 *
 * Photos are stored in Netlify Blobs so they persist until intentionally
 * deleted (design goal #1). Captions live in a separate store keyed by
 * filename so editing a caption never touches the photo bytes.
 */
const STORE_NAME = 'karens-gallery';
const CAPTIONS_STORE_NAME = 'karens-gallery-captions';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_CAPTION_LENGTH = 4000;
const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

type CaptionRecord = { caption: string; updatedAt: string };

function extForType(type: string): string | null {
  const entry = Object.entries(IMAGE_TYPES).find(([, t]) => t === type.toLowerCase());
  return entry ? entry[0] : null;
}

export default async (req: Request, context: Context) => {
  const store = getStore(STORE_NAME);
  const captionsStore = getStore(CAPTIONS_STORE_NAME);
  const url = new URL(req.url);
  const path = url.pathname;

  // PUT /api/gallery/images/:filename/caption
  const captionMatch = path.match(/^\/api\/gallery\/images\/([0-9a-z.-]+)\/caption$/i);
  if (captionMatch && req.method === 'PUT') {
    const name = captionMatch[1];
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (!IMAGE_TYPES[ext]) return Response.json({ error: 'Bad filename' }, { status: 400 });
    const existingPhoto = await store.get(name, { type: 'arrayBuffer' });
    if (!existingPhoto) return Response.json({ error: 'Photo not found' }, { status: 404 });
    let body: { caption?: unknown };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const caption = typeof body.caption === 'string' ? body.caption.trim() : '';
    if (caption.length > MAX_CAPTION_LENGTH) {
      return Response.json({ error: 'That comment is too long' }, { status: 413 });
    }
    if (caption) {
      const record: CaptionRecord = { caption, updatedAt: new Date().toISOString() };
      await captionsStore.setJSON(name, record);
      return Response.json({ url: `/api/gallery/images/${name}`, caption: record.caption });
    }
    // Empty text clears the comment for this photo.
    await captionsStore.delete(name);
    return Response.json({ url: `/api/gallery/images/${name}`, caption: '' });
  }

  // GET or DELETE /api/gallery/images/:filename
  const imageMatch = path.match(/^\/api\/gallery\/images\/([0-9a-z.-]+)$/i);
  if (imageMatch && (req.method === 'GET' || req.method === 'DELETE')) {
    const name = imageMatch[1];
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (!IMAGE_TYPES[ext]) return new Response('Bad filename', { status: 400 });
    if (req.method === 'DELETE') {
      // Deletes exactly one named photo at the user's explicit request.
      const existing = await store.get(name, { type: 'arrayBuffer' });
      if (!existing) return Response.json({ error: 'Photo not found' }, { status: 404 });
      await store.delete(name);
      // Clean up that photo's comment too — it's meaningless once the photo is gone.
      await captionsStore.delete(name);
      return Response.json({ ok: true });
    }
    const blob = await store.get(name, { type: 'arrayBuffer' });
    if (!blob) return new Response('Not found', { status: 404 });
    return new Response(blob, {
      headers: {
        'Content-Type': IMAGE_TYPES[ext],
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  // POST /api/gallery/upload
  if (path === '/api/gallery/upload' && req.method === 'POST') {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return Response.json({ error: 'Expected a multipart form upload' }, { status: 400 });
    }
    const file = form.get('photo');
    if (!(file instanceof File)) return Response.json({ error: 'No file uploaded' }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: 'Photo is larger than 10MB' }, { status: 413 });
    const ext = extForType(file.type) ?? (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z]/g, '') ?? 'jpg';
    if (!IMAGE_TYPES[ext]) return Response.json({ error: 'Only JPG, PNG, GIF, or WebP photos are supported' }, { status: 400 });
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    await store.set(name, await file.arrayBuffer(), { metadata: { contentType: file.type } });
    return Response.json({ url: `/api/gallery/images/${name}` });
  }

  // GET /api/gallery
  if (path === '/api/gallery' && req.method === 'GET') {
    const { blobs } = await store.list();
    const keys = blobs
      .map((b) => b.key)
      .filter((k) => /\.(jpg|jpeg|png|gif|webp)$/i.test(k))
      .sort()
      .reverse(); // filenames start with a timestamp, so this is newest first
    const { blobs: captionBlobs } = await captionsStore.list();
    const captionKeys = new Set(captionBlobs.map((b) => b.key));
    const images = await Promise.all(
      keys.map(async (k) => {
        if (!captionKeys.has(k)) return { url: `/api/gallery/images/${k}` };
        const record = (await captionsStore.get(k, { type: 'json' })) as CaptionRecord | null;
        return { url: `/api/gallery/images/${k}`, caption: record?.caption || undefined };
      })
    );
    return Response.json({ images });
  }

  return Response.json({ error: 'Not found' }, { status: 404 });
};

export const config: Config = {
  path: ['/api/gallery', '/api/gallery/upload', '/api/gallery/images/*', '/api/gallery/images/*/caption'],
};
