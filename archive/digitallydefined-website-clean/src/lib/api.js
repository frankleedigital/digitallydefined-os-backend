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
  console.log('[api] ' + method + ' ' + url, body ? { ...body } : undefined);
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const raw = await res.text();
    const json = raw ? JSON.parse(raw) : {};
    if (!res.ok) {
      const message = json?.error?.message || json?.error || 'Request failed (' + res.status + ')';
      console.error('[api] error ' + res.status + ' for ' + url + ':', message);
      throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
    }
    console.log('[api] success ' + url, json);
    return json;
  } catch (err) {
    console.error('[api] network/error for ' + url + ':', err.message);
    throw err;
  }
}

/** Call a modular backend agent. mode: freeMode | proMode | ultraMode */
export function callAgent(agent, params, mode = 'freeMode') {
  const path = AGENT_PATHS[agent];
  if (!path) throw new Error('Unknown agent: ' + agent);
  return request(config.backendUrl + path, {
    body: { ...params, mode },
    apiKey: config.dashboardApiKey,
  });
}

/** Submit the quiz to the Supabase Edge Function (scores, stores, emails). */
export function submitQuiz({ answers, name, email }) {
  console.log('[api] submitQuiz', { name, email, answersCount: Object.keys(answers).length });
  return request(config.functionsUrl + '/quiz-submit', {
    body: { answers, name, email },
  });
}

/** Fetch a stored roadmap for an email. */
export function fetchRoadmap(email) {
  const url = config.functionsUrl + '/quiz-roadmap?email=' + encodeURIComponent(email);
  console.log('[api] fetchRoadmap', { email });
  return request(url, { method: 'GET' });
}