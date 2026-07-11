import { getStore } from '@netlify/blobs';
import type { Config } from '@netlify/functions';

/**
 * Trip data API on Netlify.
 * - GET /api/trip -> current trip data (empty object if none yet)
 * - PUT /api/trip -> save trip data
 *
 * Data is stored in Netlify Blobs, which persists across deploys and
 * restarts — nothing is lost unless it is intentionally overwritten or
 * deleted (design goal #1).
 */
const STORE_NAME = 'karens-trip';
const TRIP_KEY = 'trip.json';

export default async (req: Request) => {
  const store = getStore(STORE_NAME);

  if (req.method === 'GET') {
    try {
      const data = await store.get(TRIP_KEY, { type: 'json' });
      return Response.json(data ?? {});
    } catch (e) {
      return Response.json({ error: 'Failed to load trip data' }, { status: 500 });
    }
  }

  if (req.method === 'PUT') {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    try {
      await store.setJSON(TRIP_KEY, body);
      return Response.json({ ok: true });
    } catch (e) {
      return Response.json({ error: 'Failed to save trip data' }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
};

export const config: Config = {
  path: '/api/trip',
};
