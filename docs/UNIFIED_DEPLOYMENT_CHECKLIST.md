# DigitallyDefined — Unified Deployment Checklist

**OmniRoute endpoint (canonical):** `OMNIROUTE_BASE_URL=http://45.79.180.236:20128`
All clients accept the base URL with or without a trailing `/v1` and normalize it internally.
Model config: `OMNIROUTE_MODEL=auto`, `OMNIROUTE_FALLBACK_MODEL_1=auto/best-free`.

## Repo roles
| Repo | Role | AI path |
|---|---|---|
| digitallydefined-os-backend | **Canonical Supabase edge functions + Node/Vercel API** | Hermes edge → OmniRoute |
| digitallydefined-dashboard | Dashboard SPA (Vercel) | callSupabaseEdge → Hermes edge |
| digitallydefined-online-local | Marketing site (Vercel, pnpm) | hermes.js → Hermes edge |

No repo except os-backend contains edge functions or calls OmniRoute directly.

## Completed in repair phase
- [x] OmniRoute URL normalization everywhere (`_shared/omniroute.ts`, `hermes/index.ts`, `analytics/index.ts`, `_shared/aiRouter.ts`, `lib/omniroute.js`, `lib/aiRouter.js`, `api/index.js`)
- [x] Rebuilt working `lib/omniroute.js` (fixed missing-import crash); sync-aggregator works again
- [x] Edge functions consolidated to os-backend; online-local tree removed; dashboard api/* proxies deleted and callers migrated to `callSupabaseEdge`
- [x] `integration.*` handlers ported into Hermes edge function (identical response shapes)
- [x] `deno check` passes on all touched edge files; both frontends build clean
- [x] Env templates rewritten (OmniRoute-only, one shared key name)
- [x] Dead provider keys stripped from local env files
- [x] online-local: `frontend-homepage-refactor` merged to main; pnpm standardized

## Full setup (session 2)
- [x] All edge functions deployed from os-backend: hermes, analytics, followup, sync, sellable
- [x] Hermes MCP: provider base_url fixed (was localhost → Linode), model `auto`, key verified matching backend
- [x] Premium gating: `license.verify` edge action (Gumroad License API, refund-aware) + `PremiumGate`
- [x] Dashboard routes `/intelligence` and `/assistant` gated by auth + verified license (24h cache)
- [x] Gumroad secrets set in Supabase: GUMROAD_API_KEY, GUMROAD_PRODUCT_PERMALINK=digital-business-os

## Remaining (manual)
- [ ] Apply `premium_entitlements` table migration (optional — verification works without it; logging is guarded)
- [ ] Deploy both frontends to Vercel with the aligned `VITE_DASHBOARD_API_KEY`
- [ ] Browser-level checks: website calculator mentor + dashboard quiz→Intelligence UI + license unlock flow

## Commit log (repair phase)
- os-backend: `91a8c88`, `bb3532f`, `e692b20`
- dashboard: `10fe8f4b`, `9bc0d81d`
- online-local: `a6afca8`, merge `6789429`, `48447e7`
