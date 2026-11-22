// src/services/kb/collectors/gumroadProducts.js
// ============================================================================
// COLLECTOR 2 — GUMROAD PRODUCT CATALOG.
//
// Pulls the live Gumroad product catalog via the existing premium service and
// upserts each listing into `product_registry` (the product source of truth).
// Also ensures a matching business_assets row exists for each product.
//
// Reuses listGumroadProducts() — no new Gumroad auth logic.
// C1: each registry row carries evidence pointing at the Gumroad listing.
// ============================================================================

import { listGumroadProducts } from '../../premium.js';
import { kbUpsert, kbRead } from '../kbSupabase.js';
import { evidence } from '../evidence.js';

/** Derive a stable slug from a Gumroad permalink. */
function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Best-effort persona tag from the product name/description. */
function guessPersona(name, desc) {
  const t = ((name || '') + ' ' + (desc || '')).toLowerCase();
  if (/retirement|wealth|net worth|asset/.test(t)) return 'wealth';
  if (/affiliate|flip|commission/.test(t)) return 'affiliate';
  if (/quiz|superpower|persona/.test(t)) return 'quiz';
  if (/dashboard|legacy|os/.test(t)) return 'legacy-os';
  return 'general';
}

export async function collectGumroadProducts() {
  const { products, error } = await listGumroadProducts();
  if (!Array.isArray(products)) {
    return { written: 0, skipped: 1, error: error || 'no products returned' };
  }

  let written = 0;
  let skipped = 0;
  for (const p of products) {
    const name = p.name || p.product_name;
    if (!name) { skipped += 1; continue; }
    const slug = slugify(p.permalink || name);
    const priceCents = p.price != null ? Math.round(Number(p.price) * 100) : null;

    // 1) business_assets row (asset_type=product), idempotent.
    await kbUpsert('business_assets', {
      asset_type: 'product',
      name,
      url: p.url || p.permalink ? 'https://gumroad.com/l/' + (p.permalink || slug) : null,
      owner: 'gumroad',
      status: p.archived ? 'retired' : 'active',
    }, 'asset_type,name');

    // 2) product_registry row (the source of truth), keyed by slug.
    const stored = await kbUpsert('product_registry', {
      slug,
      name,
      price_cents: priceCents,
      price_source: 'gumroad',
      status: p.archived ? 'retired' : 'live',
      gumroad_id: p.id != null ? String(p.id) : null,
      persona_fit: guessPersona(name, p.description),
      evidence: [evidence('product_registry', slug, `gumroad listing #${p.id || 'n/a'}`)],
      updated_at: new Date().toISOString(),
    }, 'slug');
    if (stored) written += 1; else skipped += 1;
  }
  return { written, skipped, total: products.length, source: 'gumroad-products' };
}

export default { collectGumroadProducts };
