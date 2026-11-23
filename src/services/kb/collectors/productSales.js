// src/services/kb/collectors/productSales.js
// ============================================================================
// COLLECTOR 3 + PRIORITY 3 — PRODUCT SALES & REVENUE ENRICHMENT.
//
// Syncs `product_purchases` (PayPal + Gumroad webhook) up into
// `product_registry` so the product source of truth knows:
//   - first_sale_at / last_sale_at (dormancy)
//   - sales_count + revenue_cents_total (revenue enrichment)
//   - which registry row each purchase maps to (product_id backfill)
//
// Then flags dormant products (no sale in N days) as a P2 problem. Every
// registry enrichment carries revenue_evidence (C1) tracing back to the
// purchase rows that produced the totals.
// ============================================================================

import { kbRead, kbUpsert } from '../kbSupabase.js';
import { evidence } from '../evidence.js';
import { upsertProblem } from '../problemTracker.js';

const DORMANT_DAYS = 30;
const isRealSale = (s) => s === 'completed' || s === 'delivered';

export async function collectProductSales({ dormantDays = DORMANT_DAYS } = {}) {
  const registry = await kbRead('product_registry');
  const regByName = new Map(registry.map((r) => [String(r.name || '').toLowerCase(), r]));
  const regBySlug = new Map(registry.map((r) => [String(r.slug || '').toLowerCase(), r]));

  const purchases = await kbRead('product_purchases', 'limit=1000');
  // Per-product aggregation keyed by lower(product_name).
  const stats = new Map(); // key -> {first,last,count,revenueCents,ids}
  for (const p of purchases) {
    const key = String(p.product_name || '').toLowerCase();
    if (!key) continue;
    const s = stats.get(key) || { first: null, last: null, count: 0, revenueCents: 0, ids: [] };
    const ts = p.created_at;
    if (ts) {
      if (!s.first || ts < s.first) s.first = ts;
      if (!s.last || ts > s.last) s.last = ts;
    }
    if (isRealSale(p.status)) {
      s.count += 1;
      s.revenueCents += Math.round((Number(p.product_price) || 0) * 100);
    }
    if (s.ids.length < 10) s.ids.push(String(p.id));
    stats.set(key, s);
  }

  let updated = 0;
  const dormants = [];
  let linked = 0;
  for (const [key, s] of stats.entries()) {
    const reg = regByName.get(key) || regBySlug.get(key);
    if (!reg) continue; // purchase name not in registry yet

    // C1: trace revenue to the purchase rows that produced it.
    const revEvidence = s.ids.map((id) => evidence('product_purchases', id, `sale of ${reg.name}`));
    const patch = {
      id: reg.id,
      first_sale_at: s.first || reg.first_sale_at || null,
      last_sale_at: s.last || reg.last_sale_at || null,
      sales_count: s.count,
      revenue_cents_total: s.revenueCents,
      revenue_evidence: revEvidence,
      updated_at: new Date().toISOString(),
    };
    await kbUpsert('product_registry', patch, 'id');
    updated += 1;

    // Backfill product_id on the purchase rows so they link to the registry.
    for (const p of purchases) {
      if (String(p.product_name || '').toLowerCase() === key && p.product_id == null) {
        await kbUpsert('product_purchases', { id: p.id, product_id: reg.id }, 'id');
        linked += 1;
      }
    }

    // Dormancy: has been live but no sale in `dormantDays` days.
    if (reg.status === 'live' && s.last) {
      const days = Math.floor((Date.now() - new Date(s.last).getTime()) / 86400000);
      if (days >= dormantDays) {
        dormants.push({ slug: reg.slug, name: reg.name, days_since_last_sale: days });
        await upsertProblem({
          domain: 'revenue',
          title: `Product "${reg.name}" dormant ${days} days (last sale ${s.last})`,
          severity: 'P2',
          source_table: 'product_registry',
          source_id: reg.id,
          evidence: [
            evidence('product_registry', reg.id, `last_sale_at ${s.last}, sales ${s.count}`),
            ...s.ids.slice(0, 3).map((id) => evidence('product_purchases', id, 'sale record')),
          ],
        });
      }
    }
  }
  return {
    updated,
    linked,
    dormants,
    products_in_registry: registry.length,
    purchases: purchases.length,
  };
}

export default { collectProductSales };

