// src/lib/session.js — lightweight client session for the dashboard
const SESSION_KEY = 'dd_session';

export { SESSION_KEY };

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(value) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(value));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
