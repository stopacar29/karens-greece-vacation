import { getStore } from '@netlify/blobs';
import type { Config } from '@netlify/functions';

/**
 * Memories API on Netlify.
 * - GET    /api/memories       -> { memories: [...] } (newest first)
 * - POST   /api/memories       -> { author, text } creates a memory
 * - PUT    /api/memories/:id   -> { text } edits one memory
 * - DELETE /api/memories/:id   -> removes one memory (explicit, single-item
 *   only — never bulk wipes; see .cursor/rules/preserve-trip-data.mdc)
 *
 * Each memory is its own blob keyed by id, so writes are additive and edits
 * or deletes can only ever touch the one memory they name.
 */
const STORE_NAME = 'karens-memories';
const MAX_TEXT_LENGTH = 10000;

type Memory = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  editedAt?: string;
};

export default async (req: Request) => {
  const store = getStore(STORE_NAME);
  const url = new URL(req.url);
  const path = url.pathname;

  const idMatch = path.match(/^\/api\/memories\/([0-9a-z-]+)$/i);

  if (path === '/api/memories' && req.method === 'GET') {
    const { blobs } = await store.list();
    const memories: Memory[] = [];
    for (const b of blobs) {
      const m = (await store.get(b.key, { type: 'json' })) as Memory | null;
      if (m && m.id && m.text) memories.push(m);
    }
    // ids start with a timestamp, so sorting keys descending is newest first
    memories.sort((a, b) => (a.id < b.id ? 1 : -1));
    return Response.json({ memories });
  }

  if (path === '/api/memories' && req.method === 'POST') {
    let body: { author?: unknown; text?: unknown };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const author = typeof body.author === 'string' ? body.author.trim() : '';
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!author) return Response.json({ error: 'Please pick who you are first' }, { status: 400 });
    if (!text) return Response.json({ error: 'The memory is empty' }, { status: 400 });
    if (text.length > MAX_TEXT_LENGTH) return Response.json({ error: 'That memory is too long' }, { status: 413 });
    const memory: Memory = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      author,
      text,
      createdAt: new Date().toISOString(),
    };
    await store.setJSON(memory.id, memory);
    return Response.json({ memory });
  }

  if (idMatch && req.method === 'PUT') {
    const id = idMatch[1];
    let body: { text?: unknown };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) return Response.json({ error: 'The memory is empty' }, { status: 400 });
    if (text.length > MAX_TEXT_LENGTH) return Response.json({ error: 'That memory is too long' }, { status: 413 });
    const existing = (await store.get(id, { type: 'json' })) as Memory | null;
    if (!existing) return Response.json({ error: 'Memory not found' }, { status: 404 });
    const updated: Memory = { ...existing, text, editedAt: new Date().toISOString() };
    await store.setJSON(id, updated);
    return Response.json({ memory: updated });
  }

  if (idMatch && req.method === 'DELETE') {
    // Deletes exactly one memory at the user's explicit, confirmed request.
    const id = idMatch[1];
    const existing = (await store.get(id, { type: 'json' })) as Memory | null;
    if (!existing) return Response.json({ error: 'Memory not found' }, { status: 404 });
    await store.delete(id);
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Not found' }, { status: 404 });
};

export const config: Config = {
  path: ['/api/memories', '/api/memories/*'],
};
