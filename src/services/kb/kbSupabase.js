// src/services/kb/kbSupabase.js
// ============================================================================
// Business Knowledge Base — Supabase access layer.
//
// Thin, typed helpers over the existing service-role PostgREST client
// (src/services/supabaseRest.js). The KB is written ONLY through here, with
// the service_role key, so every write is audited and RLS-safe.
//
// This module is the single door into the KB tables. Collectors, the
// context builder, the detectors and the command plane all import from here.
// ============================================================================

import supabaseRest from '../supabaseRest.js';

/**
 * Read rows from a KB table with an optional PostgREST filter query string.
 * @returns {Array<object>} - [] when Supabase REST is not configured
 */
export async function kbRead(table, query = '') {
  try {
    return await supabaseRest.select(table, query);
  } catch (err) {
    // Graceful: an unconfigured KB must never crash an agent run.
    // eslint-disable-next-line no-console
    console.warn(`[kb] read ${table} failed: ${err.message}`);
    return [];
  }
}

/**
 * Insert or upsert a KB row. Returns the stored row (or null on failure).
 * `onConflict` is a unique-constraint column list, e.g. 'asset_type,name'.
 */
export async function kbUpsert(table, row, onConflict) {
  try {
    return await supabaseRest.upsert(table, row, onConflict);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[kb] upsert ${table} failed: ${err.message}`);
    return null;
  }
}

/** Insert a row (no conflict resolution). */
export async function kbInsert(table, row) {
  try {
    return await supabaseRest.upsert(table, row);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[kb] insert ${table} failed: ${err.message}`);
    return null;
  }
}

/** True when the KB is reachable (service-role credentials present). */
export function isKbConfigured() {
  return supabaseRest.isSupabaseRestConfigured();
}

export default { kbRead, kbUpsert, kbInsert, isKbConfigured };

