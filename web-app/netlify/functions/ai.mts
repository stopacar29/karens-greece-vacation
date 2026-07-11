import type { Config } from '@netlify/functions';

/**
 * AI endpoints on Netlify — everything runs on Claude with one key.
 * Set ANTHROPIC_API_KEY in the Netlify dashboard (Site settings → Environment variables).
 *
 * - POST /api/suggestions  { location, lat, lng }        -> { location, suggestions: [...] }
 * - POST /api/parse        { pdfBase64, fileName? }      -> partial TripData extracted from the PDF
 * - POST /api/ocr          { imageBase64, mimeType? }    -> partial TripData extracted from the image
 */

const MODEL = 'claude-sonnet-4-6';

const TRIP_DATA_SCHEMA = `
Return valid JSON only, no markdown. Use this exact shape (use empty strings or empty arrays where you have no data):
{
  "tripStartDate": "",
  "tripEndDate": "",
  "flights": { "paul-karen": [], "lance-allison": [], "leah-brent": [], "noah-cori": [] },
  "accommodationList": { "all": [], "paul-karen": [], "lance-allison": [], "leah-brent": [], "noah-cori": [] },
  "activities": { "all": [], "adults": [], "paul-karen": [], "lance-allison": [], "leah-brent": [], "noah-cori": [] },
  "transfers": {
    "paul-karen": { "toAirport": "", "fromAirport": "" },
    "lance-allison": { "toAirport": "", "fromAirport": "" },
    "leah-brent": { "toAirport": "", "fromAirport": "" },
    "noah-cori": { "toAirport": "", "fromAirport": "" }
  },
  "gettingAround": "",
  "importantNumbers": ""
}
Family ids: paul-karen (Grammy and Papa), lance-allison, leah-brent, noah-cori. Use "all" for things that apply to everyone and "adults" for adults-only activities.
Each flight: { "departureDate": "MM-DD", "airline": "", "flightNumber": "", "departureAirport": "XXX", "departureTime": "", "arrivalAirport": "XXX", "arrivalTime": "" }.
Each accommodation entry: { "checkIn": "MM-DD", "details": "" }.
Each activity: { "activity": "", "date": "MM-DD", "time": "", "dressCode": "", "notes": "" }.
Dates are month-day only in "MM-DD" form (e.g. "07-19").`;

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } };

async function askClaude(content: ContentBlock[], maxTokens = 2048): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set on the site (Netlify → Site settings → Environment variables).');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content }],
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Claude API error ${res.status}: ${err.slice(0, 300)}`);
  }
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const text = data.content?.find((b) => b.type === 'text')?.text?.trim();
  if (!text) throw new Error('Empty response from Claude');
  return text;
}

/** Claude sometimes wraps JSON in ``` fences; strip them before parsing. */
function parseJson(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
}

export default async (req: Request) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const path = new URL(req.url).pathname;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    if (path === '/api/suggestions') {
      const { location, lat, lng } = body as { location?: string; lat?: number; lng?: number };
      if (!location) return Response.json({ error: 'Missing location name' }, { status: 400 });
      const text = await askClaude([
        {
          type: 'text',
          text: `You are a travel guide for a family vacation in July/August 2026 visiting Athens, Santorini, Crete, London, Istanbul, Cappadocia, and Ephesus. The group includes grandparents, parents, and children ages roughly 3-15.

Give me 6-8 suggestions of things to do at or near "${location}" (coordinates: ${lat}, ${lng}). For each suggestion include:
- Name of the activity/place
- A one-sentence description
- Who it's best for (e.g. "great for kids", "romantic for couples", "everyone")
- Approximate cost (free, $, $$, $$$)

Format as JSON array: [{"name": "...", "description": "...", "bestFor": "...", "cost": "..."}]
Return only valid JSON, no markdown.`,
        },
      ]);
      return Response.json({ location, suggestions: parseJson(text) });
    }

    if (path === '/api/parse') {
      const { pdfBase64 } = body as { pdfBase64?: string };
      if (!pdfBase64) return Response.json({ error: 'Missing pdfBase64 in body' }, { status: 400 });
      const text = await askClaude([
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
        { type: 'text', text: `Extract trip information from this PDF. ${TRIP_DATA_SCHEMA}` },
      ]);
      return Response.json(parseJson(text));
    }

    if (path === '/api/ocr') {
      const { imageBase64, mimeType } = body as { imageBase64?: string; mimeType?: string };
      if (!imageBase64) return Response.json({ error: 'Missing imageBase64 in body' }, { status: 400 });
      const text = await askClaude([
        { type: 'image', source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: imageBase64 } },
        { type: 'text', text: `Extract trip information from this image. ${TRIP_DATA_SCHEMA}` },
      ]);
      return Response.json(parseJson(text));
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'AI request failed' }, { status: 500 });
  }
};

export const config: Config = {
  path: ['/api/suggestions', '/api/parse', '/api/ocr'],
};
