// src/routes/notion.js
// Notion action handlers
import { checkDashboardApiKey } from '../middleware/auth.js';

export async function handleNotionPageCreate(req, res) {
  if (!checkDashboardApiKey(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // TODO: Migrate from api/index.js lines 1201-1241
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({ ok: true, message: 'Notion page create handler scaffolded' });
}

export async function handleNotionIntakeReport(req, res) {
  if (!checkDashboardApiKey(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // TODO: Migrate from api/index.js lines 1243+
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({ ok: true, message: 'Notion intake report handler scaffolded' });
}

export default { handleNotionPageCreate, handleNotionIntakeReport };
