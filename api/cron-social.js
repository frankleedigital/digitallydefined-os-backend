// api/cron-social.js
// Vercel Cron Endpoint for 3x daily Social Media Auto-Publishing

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { runAutoPost } = await import('../src/services/socialContentEngine.js');
    const slot = req.query?.slot || undefined;
    const result = await runAutoPost(slot);
    return res.status(200).json({
      success: true,
      executionTime: new Date().toISOString(),
      result
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      executionTime: new Date().toISOString()
    });
  }
}
