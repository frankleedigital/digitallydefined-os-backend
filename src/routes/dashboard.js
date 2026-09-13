// src/routes/dashboard.js
// Dashboard action handler - mirrors original api/index.js dashboard logic
import { checkDashboardApiKey } from '../middleware/auth.js';

const ALLOWED_ACTIONS = new Set([
  '"status"', '"auth.verify"', '"test-env"', '"dashboard"', '"ai.recommendations"',
  '"brain.brief"', '"chat"', '"public.chat"', '"mentor.dev"', '"hermes.agent"',
  '"intelligence"', '"automation.sync"', '"automation.list"', '"automation.logs"',
  '"automation.events"', '"automation.run"', '"subscribe"', '"contact"',
  '"quiz.complete"', '"integration.googleAnalytics"', '"integration.social"',
  '"integration.email"', '"integration.community"', '"integration.google.start"',
  '"integration.social.start"', '"integration.email.start"', '"integration.community.start"',
  '"license.verify"', '"antigravity"', '"antigravity.createNotionPage"',
  '"antigravity.updateDatabase"', '"antigravity.buildTemplate"', '"antigravity.runAutomation"',
  '"antigravity.status"', '"website.content"', '"website.edit"',
]);

const GET_ONLY_ACTIONS = new Set(['status', 'auth.verify', 'test-env']);
const GET_OR_POST_ACTIONS = new Set(['dashboard', 'automation.list', 'automation.logs', 'automation.events']);
const POST_ONLY_ACTIONS = new Set(['automation.sync', 'automation.run']);

export function validateMethodForAction(action, method) {
  if (GET_ONLY_ACTIONS.has(action) && method !== 'GET') {
    return { status: 405, body: { error: `Method ${method} not allowed for action ${action}. Use GET.` } };
  }
  if (POST_ONLY_ACTIONS.has(action) && method !== 'POST') {
    return { status: 405, body: { error: `Method ${method} not allowed for action ${action}. Use POST.` } };
  }
  if (GET_OR_POST_ACTIONS.has(action) && !['GET', 'POST'].includes(method)) {
    return { status: 405, body: { error: `Method ${method} not allowed for action ${action}. Use GET or POST.` } };
  }
  return null;
}

export async function handleDashboard(req, res) {
  if (!checkDashboardApiKey(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // TODO: Add full dashboard logic from api/index.js lines 1197-1335
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({ status: 'ok', message: 'Dashboard handler scaffolded - need to migrate full logic' });
}

export default { handleDashboard, validateMethodForAction, ALLOWED_ACTIONS };
