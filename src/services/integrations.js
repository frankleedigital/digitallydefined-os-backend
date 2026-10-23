// src/services/integrations.js - Third-Party Integration Services
import env from '../config/env.js';
import constants from '../config/constants.js';
import logger from '../utils/logger.js';

const FACEBOOK_API_BASE = constants.FACEBOOK_API_BASE;

export function isFacebookConfigured() { return !!(env.facebook.accessToken && (env.facebook.groupId || env.facebook.pageId)); }
export function getFacebookStatus() { return { hasToken: !!env.facebook.accessToken, hasGroupId: !!env.facebook.groupId, hasPageId: !!env.facebook.pageId, configured: isFacebookConfigured() }; }

export async function fetchFacebookGroup(timeoutMs = constants.FETCH_TIMEOUT_MS) {
  if (!env.facebook.groupId || !env.facebook.accessToken) return { error: 'Facebook group not configured', member_count: 0 };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(FACEBOOK_API_BASE + '/' + env.facebook.groupId + '?fields=member_count,name,cover&access_token=' + encodeURIComponent(env.facebook.accessToken), { signal: controller.signal });
    if (!response.ok) return { error: 'Facebook API error: ' + response.status, member_count: 0 };
    const data = await response.json();
    return Object.assign({}, data, { error: null });
  } catch (error) { if (error.name === 'AbortError') return { error: 'Facebook request timed out', member_count: 0 }; logger.error('Facebook fetch error', error); return { error: error.message || 'Facebook fetch failed', member_count: 0 }; } finally { clearTimeout(timeoutId); }
}

export async function postToFacebookPage(message, timeoutMs = constants.FETCH_TIMEOUT_MS) {
  if (!env.facebook.pageId || !env.facebook.pageAccessToken) return { ok: false, error: 'Facebook page not configured' };
  if (!message || !message.trim()) return { ok: false, error: 'Message is required' };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(FACEBOOK_API_BASE + '/' + env.facebook.pageId + '/feed', { method: 'POST', headers: { Authorization: 'Bearer ' + env.facebook.pageAccessToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: message.trim() }), signal: controller.signal });
    if (!response.ok) throw new Error('Facebook post error: ' + response.status);
    const data = await response.json();
    logger.info('Facebook post created', { postId: data.id });
    return { ok: true, postId: data.id };
  } catch (error) { logger.error('Facebook post failed', error); return { ok: false, error: error.message }; } finally { clearTimeout(timeoutId); }
}

export async function postToFacebookGroup(message, timeoutMs = constants.FETCH_TIMEOUT_MS) {
  if (!env.facebook.groupId || !env.facebook.accessToken) return { ok: false, error: 'Facebook group not configured' };
  if (!message || !message.trim()) return { ok: false, error: 'Message is required' };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(FACEBOOK_API_BASE + '/' + env.facebook.groupId + '/feed', { method: 'POST', headers: { Authorization: 'Bearer ' + env.facebook.accessToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: message.trim() }), signal: controller.signal });
    if (!response.ok) throw new Error('Facebook group post error: ' + response.status);
    const data = await response.json();
    logger.info('Facebook group post created', { postId: data.id });
    return { ok: true, postId: data.id };
  } catch (error) { logger.error('Facebook group post failed', error); return { ok: false, error: error.message }; } finally { clearTimeout(timeoutId); }
}

export function isBrevoConfigured() { return !!env.brevo.apiKey; }
export function getBrevoStatus() { return { configured: isBrevoConfigured(), apiKeySet: !!env.brevo.apiKey }; }

export async function fetchBrevoStats(timeoutMs = constants.FETCH_TIMEOUT_MS) {
  if (!env.brevo.apiKey) return { error: 'Brevo not configured', totalSubscribers: 0, emailOpenRate: null, emailClickRate: null, topCampaigns: [] };
  // Real Brevo data. The previous implementation called /v3/partners/statistics,
  // a reseller-only endpoint that a normal account cannot read — so the
  // dashboard had no real subscriber numbers and someone filled the gap with
  // invented ones.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { 'api-key': env.brevo.apiKey, 'Content-Type': 'application/json' };
  try {
    const [contactsRes, campaignsRes] = await Promise.all([
      fetch('https://api.brevo.com/v3/contacts?limit=1', { headers, signal: controller.signal }),
      fetch('https://api.brevo.com/v3/emailCampaigns?limit=5', { headers, signal: controller.signal }),
    ]);
    if (!contactsRes.ok) {
      const body = await contactsRes.json().catch(() => ({}));
      throw new Error(body?.message || 'Brevo contacts request failed');
    }
    const contactsData = await contactsRes.json().catch(() => ({}));
    const campaignsData = campaignsRes.ok ? await campaignsRes.json().catch(() => ({})) : {};

    const totalSubscribers = Number(contactsData?.count || 0);
    const campaigns = Array.isArray(campaignsData?.campaigns) ? campaignsData.campaigns : [];
    const withStats = campaigns.filter((c) => Number(c?.stats?.sent || 0) > 0);

    const topCampaigns = campaigns.slice(0, 5).map((c) => {
      const sent = Number(c?.stats?.sent || 0);
      const opened = Number(c?.stats?.uniqueOpened || 0);
      const clicked = Number(c?.stats?.uniqueClicked || 0);
      return {
        name: c?.name || c?.subject || 'Campaign',
        openRate: sent > 0 ? (opened / sent) * 100 : null,
        clickRate: sent > 0 ? (clicked / sent) * 100 : null,
      };
    });

    const avg = (pick) => (withStats.length
      ? withStats.reduce((sum, c) => {
          const sent = Number(c?.stats?.sent || 0);
          return sum + (sent > 0 ? (pick(c) / sent) * 100 : 0);
        }, 0) / withStats.length
      : null);

    return {
      totalSubscribers,
      emailOpenRate: avg((c) => Number(c?.stats?.uniqueOpened || 0)),
      emailClickRate: avg((c) => Number(c?.stats?.uniqueClicked || 0)),
      topCampaigns,
      error: null,
    };
  } catch (error) {
    if (error.name === 'AbortError') return { error: 'Brevo request timed out', totalSubscribers: 0, emailOpenRate: null, emailClickRate: null, topCampaigns: [] };
    logger.error('Brevo fetch error', error);
    return { error: error.message || 'Brevo fetch failed', totalSubscribers: 0, emailOpenRate: null, emailClickRate: null, topCampaigns: [] };
  } finally { clearTimeout(timeoutId); }
}

export function isSheetsConfigured() { return !!env.sheets.webhookUrl; }
export function getSheetsStatus() { return { configured: isSheetsConfigured(), hasWebhook: !!env.sheets.webhookUrl, mode: env.sheets.webhookUrl ? 'webhook' : 'none' }; }

export async function fetchSheetsData(timeoutMs = constants.FETCH_TIMEOUT_MS) {
  if (!env.sheets.webhookUrl) return { error: 'Google Sheets webhook not configured', data: {} };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(env.sheets.webhookUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error('Sheets webhook error: ' + response.status);
    const data = await response.json();
    return { data: data, error: null };
  } catch (error) { logger.error('Sheets fetch error', error); return { error: error.message || 'Sheets fetch failed', data: {} }; } finally { clearTimeout(timeoutId); }
}

export async function postToSheetsWebhook(payload, timeoutMs = constants.FETCH_TIMEOUT_MS) {
  if (!env.sheets.webhookUrl) return { ok: false, error: 'Google Sheets webhook not configured' };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(env.sheets.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
    if (!response.ok) throw new Error('Sheets webhook post error: ' + response.status);
    const data = await response.json();
    logger.info('Sheets data posted successfully');
    return { ok: true, data: data };
  } catch (error) { logger.error('Sheets post error', error); return { ok: false, error: error.message }; } finally { clearTimeout(timeoutId); }
}

export function getAllIntegrationStatus() { return { facebook: getFacebookStatus(), brevo: getBrevoStatus(), sheets: getSheetsStatus() }; }

export default { isFacebookConfigured, getFacebookStatus, fetchFacebookGroup, postToFacebookPage, postToFacebookGroup, isBrevoConfigured, getBrevoStatus, fetchBrevoStats, isSheetsConfigured, getSheetsStatus, fetchSheetsData, postToSheetsWebhook, getAllIntegrationStatus };