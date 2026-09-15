// src/lib/api.js — typed client for the clean modular backend + Supabase functions
import { config } from './config.js';

const AGENT_PATHS = {
  niche: '/api/niche',
  roadmap: '/api/roadmap',
  scorecard: '/api/scorecard',
  product: '/api/product',
  social: '/api/social',
  trends: '/api/trends',
  dashboard: '/api/dashboard',
};

async function request(url, { method = 'POST', body, apiKey } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.error?.message || json?.error || `Request failed (${res.status})`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return json;
}

/** Call a modular backend agent. mode: freeMode | proMode | ultraMode */
export function callAgent(agent, params, mode = 'freeMode') {
  const path = AGENT_PATHS[agent];
  if (!path) throw new Error(`Unknown agent: ${agent}`);
  return request(`${config.backendUrl}${path}`, {
    body: { ...params, mode },
    apiKey: config.dashboardApiKey,
  });
}

/** Submit the quiz to the Supabase Edge Function (scores, stores, emails). */
export function submitQuiz({ answers, name, email }) {
  return request(`${config.functionsUrl}/quiz-submit`, {
    body: { answers, name, email },
  });
}

/** Fetch a stored roadmap for an email. */
export function fetchRoadmap(email) {
  const url = `${config.functionsUrl}/quiz-roadmap?email=${encodeURIComponent(email)}`;
  return request(url, { method: 'GET' });
}
