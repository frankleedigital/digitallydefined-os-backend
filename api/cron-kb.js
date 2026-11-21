// api/cron-kb.js
// Vercel Cron Endpoint — populates the Business Knowledge Base with live facts.
//
// Scheduled in vercel.json (kb-sync). It runs every KB collector so the KB
// stays current without anyone opening the dashboard:
//   integration health, gumroad products, product sales/dormancy, sops,
//   automation status.
//
// Optional ?only=integration-health,product-sales to run a subset (comma list).
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { runCollectors } = await import('../src/services/kb/collectors/index.js');
    const only = req.query?.only
      ? String(req.query.only).split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    const result = await runCollectors({ only });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
