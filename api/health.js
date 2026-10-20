export default function handler(req, res) {
  const origin = (req.headers && req.headers.origin) || '';
  const allowed = [
    'https://dashboard.digitallydefined.agency',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ];
  const corsOrigin = allowed.includes(origin) ? origin : 'https://dashboard.digitallydefined.agency';
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, apikey');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  res.status(200).json({ status: "ok" });
}