// src/services/kb/collectors/notionInventory.js
// ============================================================================
// COLLECTOR 8 (priority 4) — NOTION ASSET INVENTORY.
//
// Inventories every configured Notion database (env.notion.databases) so the
// KB knows which Notion assets exist, how many records each holds, and
// whether they are reachable. This gives Hermes awareness of the Notion
// side of the business (content/leads/asset vaults) that agents read/write.
//
// - Reuses the existing notion service (queryDatabase + status).
// - Records a notion_db_inventory row per configured DB with record_count
//   (capped count) + reachability.
// - Also ensures a business_assets row (asset_type=notion-db) exists per DB
//   so the asset registry reflects Notion.
// - Raises a problem when a configured DB is unreachable (a silent data loss
//   risk for anything that syncs to Notion).
// ============================================================================

import env from '../../../config/env.js';
import { isNotionConfigured, queryDatabase, getPage } from '../../notion.js';
import { kbUpsert, kbRead } from '../kbSupabase.js';
import { evidence } from '../evidence.js';
import { upsertProblem } from '../problemTracker.js';

// Count records in a DB (capped at page_size=100 by the notion service).
// Returns null when unreachable. ">=100" is reported as 100+ via detail.
async function countRecords(dbId) {
  try {
    const data = await queryDatabase(dbId, null, 100);
    const n = (data && data.results) ? data.results.length : 0;
    return { count: n, more: !!(data && data.has_more) };
  } catch {
    return null; // unreachable
  }
}

export async function collectNotionInventory() {
  const configured = isNotionConfigured();
  const dbs = env.notion.databases || {};
  let written = 0;
  let unreachable = 0;

  for (const [key, dbId] of Object.entries(dbs)) {
    if (!dbId) continue; // skip unconfigured DBs
    let title = null;
    let recordCount = null;
    let hasMore = false;
    let reachable = configured;

    if (configured) {
      try {
        const meta = await getPage(dbId).catch(() => null);
        title = meta && meta.title ? meta.title.map((t) => t.plain_text).join('') : null;
        const c = await countRecords(dbId);
        reachable = c != null;
        if (c) { recordCount = c.count; hasMore = c.more; }
      } catch {
        reachable = false;
      }
    }

    const row = await kbUpsert('notion_db_inventory', {
      db_key: key,
      db_id: dbId,
      title: title || key,
      record_count: recordCount,
      last_synced_at: reachable ? new Date().toISOString() : null,
      reachable,
      detail: { configured, has_more: hasMore },
      evidence: [evidence('notion_db_inventory', key, reachable
        ? (hasMore ? 'reachable, 100+ records' : `reachable, ${recordCount} records`)
        : 'unreachable or not configured')],
      updated_at: new Date().toISOString(),
    }, 'db_key,db_id');
    if (row) written += 1;

    // Ensure an asset row exists for the Notion DB.
    await kbUpsert('business_assets', {
      asset_type: 'notion-db',
      name: title || key,
      owner: 'notion',
      status: reachable ? 'active' : 'blocked',
      notes: dbId,
    }, 'asset_type,name');

    if (!reachable) {
      unreachable += 1;
      await upsertProblem({
        domain: 'data',
        title: `Notion database "${key}" is not reachable`,
        severity: 'P1',
        source_table: 'notion_db_inventory',
        source_id: key,
        evidence: [evidence('notion_db_inventory', key, 'query failed / not configured')],
      });
    }
  }
  return { written, dbs_configured: Object.values(dbs).filter(Boolean).length, unreachable, notion_configured: configured };
}

export default { collectNotionInventory };
