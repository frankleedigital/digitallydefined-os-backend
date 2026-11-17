# GA Migration Report — Deleted Property → Live Dashboard Property
**2026-11-10 · Direction B (confirmed by owner)**
Old: property `532506061` / `G-SQGCJN9WG3` (deleted, in GA trash — DigitallyDefined.online era)
New: property **`563506381`** / **`G-GQE8DZ15BL`** (owns `dashboard.digitallydefined.agency`)

## Status: ✅ COMPLETE & LIVE
The GA card now returns **`connected: true`** on the live backend with a fresh fetch and **zero errors**.

---

## Files changed
| File | Change |
|---|---|
| `digitallydefined-os-backend/.env` L60-61 | `GA4_MEASUREMENT_ID`→`G-GQE8DZ15BL`, `GA4_PROPERTY_ID`→`563506381` |
| `digitallydefined-os-backend/.env` L134-135 | `GA_MEASUREMENT_ID`→`G-GQE8DZ15BL`, `GA_PROPERTY_ID`→`563506381` |
| `digitallydefined-dashboard/.env` L48-49 | `VITE_GA_MEASUREMENT_ID`→`G-GQE8DZ15BL`, `VITE_GA_PROPERTY_ID`→`563506381` |
| `digitallydefined-dashboard/.env` L51 | unchanged (was already `G-GQE8DZ15BL`) |
| `digitallydefined-backend-clean/.env` L248-249 | **deleted** `GA4_*` lines (dead duplicate) |
| `archive/digitallydefined-backend-clean/.env` L246-247 | **deleted** `GA4_*` lines (archived dup) |
| `digitallydefined-os-backend/api/index.js` | **bug fix found during migration**: `events`→`eventCount`, `nonBounceRate`→`bounceRate` (both were invalid GA4 Data API v1beta metric names; the first one was masking the successful auth). Committed `68a415f` |

**References removed: 10 lines** (4 active values repointed, 4 deleted in dead dups). Legacy grep across all `.env`/`.js`/`.jsx`: **0 remaining** (mentions exist only in report docs, which is intentional).

## Vercel env vars changed
| Project | Var | Before → After |
|---|---|---|
| backend | `GA_MEASUREMENT_ID` (prod) | G-SQGCJN9WG3 → **G-GQE8DZ15BL** |
| backend | `GA_PROPERTY_ID` (prod) | 532506061 → **563506381** |
| backend | `GA4_MEASUREMENT_ID` (prod+preview) | G-SQGCJN9WG3 → **G-GQE8DZ15BL** |
| backend | `GA4_PROPERTY_ID` (prod+preview) | 532506061 → **563506381** |
| dashboard | `VITE_GA_MEASUREMENT_ID` (prod) | G-SQGCJN9WG3 (60d stale) → **G-GQE8DZ15BL** |
| dashboard | `VITE_GA_PROPERTY_ID` (prod+preview) | *(was missing)* → **563506381** |

`GA_SA_KEY_B64` unchanged. Deploys: backend `p17wbejdr` (prod, with metric fix), dashboard `8l21jpkzn` (prod, new VITE values inlined).

## Verification results (all live probes 2026-11-10 ~18:25 UTC)
1. **Service account access** — ✅ the old "insufficient permissions" error is **gone**; the JWT→token→runReport pipeline authenticates and is authorized against `563506381` (the new property already has the SA).
2. **GA4 API reporting** — ✅ `integration.googleAnalytics` returns `{"connected": true, "propertyId": "563506381", "measurementId": "G-GQE8DZ15BL", "lastUpdated": …, no error}`. Metrics currently `null` = valid empty report (property is new/low-traffic; the SPA tag started sending ~today, and GA4 data lands with a delay).
3. **Vercel env vars** — ✅ all six vars read back with new values; zero old values anywhere.
4. **Deployed dashboard bundle** — ✅ `digitallydefined-dashboard-8l21jpkzn` JS contains `563506381` (×1) + `G-GQE8DZ15BL` (×2); old IDs: 0.
5. **Dashboard analytics cards** — the Integrations-tab GA card + GrowthTab GA block now resolve the live property; card will show real numbers as the gtag traffic accumulates (verify in 24-48h via GA Realtime / the card itself).

## Obsolete references — disposition
- `532506061` / `G-SQGCJN9WG3`: **all removed** (code, env, Vercel, dups). Only surviving mentions are in `GA_CLEANUP_PLAN.md` and this report (documentation of the migration).
- Empty `GA_API_KEY=` / `GA_SA_KEY=` lines in `os-backend/.env`: still present, unused by code (dead names) — cosmetic; can be deleted in the next housekeeping pass.
- `digitallydefined.online`: retired per owner (domain expired, property trashed) — **no further action**.

## The one thing to watch
If the card still shows empty metrics after 48h: check GA Admin → property `563506381` → Realtime to confirm the browser tag (`G-GQE8DZ15BL`) is sending, and that the property's Data Streams includes the dashboard web stream. The backend is proven healthy; only data volume is unproven.
