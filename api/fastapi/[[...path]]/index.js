// /api/fastapi/[[...path]]/index.js
// Vercel catch-all proxy: /fastapi/* → the FastAPI microservice layer.
// Path-wise equivalent of the `action: fastapi.X` dispatcher in api/index.js.
//
// Env: FASTAPI_BASE_URL (default http://localhost:8000), FASTAPI_API_KEY.

const ALLOWED = {
  'product-generator': { path: '/product-generator/generate', method: 'POST' },
  'niche': { path: '/niche/score', method: 'POST' },
  'domain': { path: '/domain/analyze', method: 'POST' },
  'affiliate': { path: '/affiliate/flip', method: 'POST' },
  'rank-rent': { path: '/rank-rent/analyze', method: 'POST' },
  'blueprint': { path: '/blueprint/generate', method: 'POST' },
  'roadmap': { path: '/roadmap/generate', method: 'POST' },
  'trends': { path: '/trends', method: 'POST' },
};

export default async function handler(req, res) {
  // -- CORS --
  const origin = (req.headers && req.headers.origin) || '';
  const allowed = [
    'https://dashboard.digitallydefined.online',
    'https://digitallydefined.online',
    'https://www.digitallydefined.online',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ];
  const corsOrigin = allowed.includes(origin) ? origin : 'https://dashboard.digitallydefined.online';
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, apikey');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Shared key auth (mirrors api/index.js).
  const provided = req.headers['x-api-key'] || '';
  const expected = process.env.FASTAPI_API_KEY || process.env.DASHBOARD_API_KEY;
  if (expected && provided !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // /fastapi/<slug>
  const slug = (req.url.split('/').filter(Boolean)[1] || '').replace(/\/+$/, '');
  const route = ALLOWED[slug];
  if (!route) return res.status(404).json({ error: `Unknown fastapi route: ${slug}` });

  const base = String(process.env.FASTAPI_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
  const upstream = await fetch(`${base}${route.path}`, {
    method: route.method,
    headers: {
      'content-type': 'application/json',
      'x-api-key': (process.env.FASTAPI_API_KEY || process.env.DASHBOARD_API_KEY || ''),
    },
    body: JSON.stringify(req.body || {}),
  });

  const text = await upstream.text();
  const contentType = upstream.headers.get('content-type') || 'application/json';
  res.status(upstream.status).setHeader('content-type', contentType);
  return res.send(text);
}