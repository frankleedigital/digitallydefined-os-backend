// src/services/ga4.js
// ============================================================================
// GA4 DATA SERVICE — reusable fetch of Google Analytics 4 data.
//
// Extracted from the integrations route so the KB collector (and any future
// consumer) can pull the same GA data without duplicating the OAuth/Sheets
// fallback logic. Two paths, in priority order:
//   1. GA4 Data API (OAuth refresh token) — live, authoritative.
//   2. Google Sheets webhook — the existing "GA4 → Sheets connector".
// Each returns a normalized { users30d, sessions30d, revenue30d, topPages,
// source, error } shape so callers don't care which path produced it.
// ============================================================================

import env from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Fetch GA4 metrics. Returns a normalized result; `error` is set when no data
 * is available (never throws).
 */
export async function fetchGa4() {
  const measurementId = env.ga4.measurementId;
  const propertyId = env.ga4.propertyId;

  // Priority 1: GA4 Data API (OAuth)
  if (measurementId && env.sheets.refreshToken && env.sheets.googleClientId && env.sheets.googleClientSecret) {
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.sheets.googleClientId,
          client_secret: env.sheets.googleClientSecret,
          refresh_token: env.sheets.refreshToken,
          grant_type: 'refresh_token',
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!tokenRes.ok) throw new Error('GA4 OAuth token refresh failed: ' + tokenRes.status);
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const endDate = new Date().toISOString().slice(0, 10);
      const startDate = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const props = propertyId ? propertyId : 'properties/' + measurementId.replace('G-', '');
      const res = await fetch(
        'https://analyticsdata.googleapis.com/v1beta/' + props + ':runReport' +
        '?metrics=ga4:activeUsers,ga4:sessions' +
        '&dimensions=name=pagePath&limit=20',
        {
          headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(15000),
        }
      );
      if (!res.ok) throw new Error('GA4 Data API error: ' + res.status + ' ' + (await res.text()).slice(0, 200));
      const data = await res.json();

      const users = data.metricHeaders && data.metricHeaders[0];
      const sessions = data.metricHeaders && data.metricHeaders[1];
      let totalUsers = 0;
      let totalSessions = 0;
      const topPages = [];
      if (data.rows) {
        for (const r of data.rows) {
          const pagePath = r.dimensions ? r.dimensions[0] : null;
          totalUsers += parseInt(r.values && r.values[users] || 0, 10);
          totalSessions += parseInt(r.values && r.values[sessions] || 0, 10);
          if (pagePath) topPages.push({ path: pagePath, sessions: parseInt(r.values[sessions] || 0, 10) });
        }
        topPages.sort((a, b) => b.sessions - a.sessions);
      }
      return {
        source: 'ga4-data-api',
        users30d: totalUsers || data.totalRecords || null,
        sessions30d: totalSessions || null,
        revenue30d: null,
        topPages: topPages.slice(0, 5),
        error: null,
      };
    } catch (err) {
      logger.warn('GA4 Data API fetch failed, falling back to Sheets', { error: err.message });
    }
  }

  // Priority 2: Google Sheets webhook (existing GA4→Sheets connector)
  if (env.sheets.webhookUrl) {
    try {
      const res = await fetch(env.sheets.webhookUrl, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error('Sheets webhook error: ' + res.status);
      const data = await res.json();
      return {
        source: 'sheets-webhook',
        users30d: data.analytics?.users30d ?? null,
        sessions30d: data.analytics?.sessions30d ?? null,
        revenue30d: data.analytics?.revenue30d ?? null,
        topPages: data.analytics?.topPages ?? [],
        error: null,
      };
    } catch (err) {
      return { source: 'sheets-webhook', users30d: null, sessions30d: null, revenue30d: null, topPages: [], error: err.message };
    }
  }

  return {
    source: 'none',
    users30d: null, sessions30d: null, revenue30d: null, topPages: [],
    error: 'GA4 not configured (need GA4_MEASUREMENT_ID + Google OAuth, or the Sheets webhook)',
  };
}

export default { fetchGa4 };
