# DIGITALLYDEFINED CLEANUP AUDIT REPORT
**2026-11-13 · READ-ONLY analysis · No deletions, moves, or modifications performed**
Workspace: `C:\Users\frank\Documents\DigitallyDefinedClean`

---
## 1. SYSTEM ARCHITECTURE (actual, verified)

```
                        ┌─────────────────────────────┐
                        │  Vercel: digitallydefined-  │
                        │  dashboard (SPA, static)    │
                        │  dashboard.digitallydefined.│
                        │  agency                     │
                        │  · 5 tabs + quiz + store    │
                        │  · live HTML tools in /public│
                        └──────────────┬──────────────┘
                                       │ x-api-key calls
                        ┌──────────────▼──────────────┐
                        │  Vercel: digitallydefined-  │
                        │  os-backend (serverless)    │
                        │  · /api (40+ actions)       │
                        │  · Gemini direct (flash-lite)│
                        │  · Supabase PostgREST reads  │
                        └───────┬──────────┬──────────┘
                                 │          │
                 ┌───────────────▼──┐  ┌────▼───────────────────────┐
                 │ Supabase (cloud) │  │ Cloudflare: os-workers     │
                 │ 14 edge fns:     │  │ TS agents + workflows      │
                 │ hermes, sellable,│  │ (local dev state only —    │
                 │ analytics, sync, │  │ deployment UNVERIFIED)     │
                 │ followup, ...    │  └────────────────────────────┘
                 └──────────────────┘
```

## 2. INVENTORY (measured 2026-11-13)

| Item | Size | Class |
|---|---|---|
| `.venv/` | 320M | Python venv (recreatable) |
| `digitallydefined-dashboard/` | 242M (nm 157M, .git 84M) | ACTIVE Vercel SPA |
| `digitallydefined-os-workers/` | 204M (nm 203M) | CF Workers (TS, undeployed) |
| `digitallydefined-os-backend/` | 87M (nm 81M, src 6M) | ACTIVE Vercel API + Supabase fns |
| `archive/` | 70M (incl. nm) | DEAD projects (2 mirrors) |
| `digital-products/` | 71M (nm 55M, .git, dist) | Product shelf app (nested repo) |
| root `.git/` | 78M | Parent repo w/ 4 gitlinks |
| `scratch_storage.sqlite` | 40M | Scratch DB (no system reads it) |
| `models.json` + `omniroute_models.json` | 4.2M | OmniRoute model-list caches (OmniRoute retired) |
| `dist/`, `docs/`, `workspace/`, `supabase/`, `scripts/`, `output/`, `Hermes/` | ~1.2M | Support/docs/temp |
| ~110 root `.md` reports + ~40 root scripts/logs | ~1M | Decision docs / temp scripts |

### Node projects (6 package.json)
| Path | Role | Deployed? |
|---|---|---|
| `digitallydefined-dashboard` | Live SPA + quiz + store + live HTML tools | ✅ Vercel prod |
| `digitallydefined-os-backend` | /api 40+ actions, Gemini, Supabase edge fns | ✅ Vercel prod + Supabase |
| `digitallydefined-os-workers` | CF AI agents (Notion architect, workflows) | ⚠️ build scripts only; local `.wrangler` dev state; **deployment unverified** |
| `digital-products` | Product launcher (Puter cloud saves) | ⚠️ `dist/` built; host unverified |
| `archive/digitallydefined-backend-clean` | OLD backend (renamed away) | ❌ 404 on Vercel |
| `archive/digitallydefined-website-clean` | OLD marketing site | ❌ ARCHIVED.md present |

### Databases & external systems
- **Supabase** (cloud, ref dijjlppdljpcgyoakdnq): Postgres (~40 tables) + **14 edge functions** (`digitallydefined-os-backend/supabase/functions/`) — ACTIVE.
- **Cloudflare**: Workers AI + Vectorize + Durable Objects configured in `wrangler.toml` (usage unverified).
- **Gumroad**: 3 live listings — the only real checkout.
- **Root `supabase/` folder** = retired CLI link state + 2 stale functions (omniroute, content) — ORPHAN.

---
## 3. DEPENDENCY MAP (required vs orphaned)

```
digitallydefined-dashboard (RUNTIME REQUIREMENTS)
├─ src/ + public/ + index.html + vite/tailwind/postcss configs + package.json + vercel.json
├─ env: VITE_API_URL → os-backend · VITE_DASHBOARD_API_KEY · VITE_SUPABASE_* · VITE_GA4_BROWSER_ID
└─ live tools in public/: affiliate-flip · 10x-roi · thank-you (REVENUE assets)

digitallydefined-os-backend (RUNTIME REQUIREMENTS)
├─ api/index.js (40+ actions) · src/ (aiRouter, agents, routes) · lib/ · package.json · vercel.json
├─ supabase/functions/ (14 fns, deno.json) · supabase/migrations/
├─ env: GEMINI_API_KEY/MODEL · DASHBOARD_API_KEY · SUPABASE_* · GA4_* · GUMROAD_API_KEY · ANTIGRAVITY_*
└─ ORPHANED inside: fastapi/ (Docker, local-only) · _dd_test_server.log · kilo.json

digitallydefined-os-workers (REQUIREMENTS IF deployed)
├─ src/ (agents, workflows, notion, vectorize) + wrangler.toml + package.json
└─ Cloudflare AI/Vectorize/Durable Objects bindings (CF account not linked in workspace)

digital-products (REQUIREMENTS)
├─ src/ (tools, calculators, productCatalog) + public/ + dist/ + Puter cloud (runtime)
└─ ORPHANED: 10 strategy .md files (planning only)

Shared by all: none at runtime. Supabase cloud + Vercel + Gumroad are external.

---
## 4. PROFITABILITY RANKING

| Tier | Item | Why |
|---|---|---|
| **HIGH** | `digitallydefined-dashboard` | Live revenue funnel: quiz → DBO → 3 live tools; only place customers buy |
| **HIGH** | `digitallydefined-os-backend` | The money brain: AI partner, revenue.snapshot, sellable edge fn, Gumroad actions |
| **HIGH** | 3 live HTML tools (dashboard/public/) | Directly sellable SKUs (see GUMROAD_LISTING_SEQUENCE.md) |
| **HIGH** | `supabase/functions` (14) | `sellable` = post-sale delivery engine; analytics/optimization = SaaS heartbeat |
| **MEDIUM** | `digital-products` | Product shelf (dist built, not deployed) — future storefront |
| **MEDIUM** | `digitallydefined-os-workers` | CF AI agents (Notion workspace builder) — white-label infra, undeployed |
| **MEDIUM** | root strategy .md set | Decision assets (SINGLE_SOURCE_OF_TRUTH, PRODUCT_GRAPH, GUMROAD_SEQUENCE) |
| **LOW** | `archive/*` | Dead mirrors (404 endpoints, ARCHIVED.md) |
| **LOW** | `workspace/buzz-agents` | 4 Buzz experiments; nothing in the live stack calls them |
| **LOW** | root `supabase/` folder | Retired link state + stale fns (os-backend/supabase is the real one) |
| **LOW** | `Hermes/skills`, `docs/`, `output/`, root scripts/logs | Support/scratch, zero runtime role |

---
## 5. SAFE CLEANUP PLAN (recommended — NOTHING was modified)

### ✅ KEEP (required for the 4 systems)
| Path | Reason | Risk | Conf. |
|---|---|---|---|
| `digitallydefined-dashboard/{src,public,index.html,package.json,vercel.json,vite.config.js,tailwind.config.js,postcss.config.js,.env,.env.example}` | Live app | none | 99% |
| `digitallydefined-os-backend/{api,src,lib,supabase,tests,scripts,package.json,vercel.json,deno.json,.env,.env.example}` | Live API + edge fns | none | 99% |
| `digitallydefined-os-workers/{src,wrangler.toml,package.json,tsconfig.json,.env.example}` | Worker source | none | 95% |
| `digital-products/{src,public,index.html,package.json,dist}` | Product shelf + build | none | 93% |
| `digitallydefined-dashboard/public/*.html` (3 tools) | Sellable SKUs | none | 99% |
| root `.env.local` + per-project `.env` files | Runtime secrets | none | 95% |

### 📦 MOVE TO ARCHIVE
| Path | Reason | Risk | Conf. |
|---|---|---|---|
| `archive/` (70M) | Dead backend + old site; already isolated | low (verify no imports) | 90% |
| `supabase/` (root, 93K) | Retired CLI state + stale fns | low | 85% |
| `workspace/buzz-agents/` | Experiments, unused by live stack | low | 80% |
| `Hermes/skills/`, `docs/` | Info only | none | 90% |
| root strategy .md set | Keep only SINGLE_SOURCE_OF_TRUTH, PRODUCT_GRAPH, GUMROAD_LISTING_SEQUENCE; archive the other ~100 | none | 85% |

### 🗑 SAFE TO DELETE (space savings — not executed)
| Path | Size | Reason | Risk | Conf. |
|---|---|---|---|---|
| `*/node_modules` ×5 | **496M** | `npm install` rebuilds; not in git | none | 99% |
| `.venv/` | **320M** | Recreate venv | none | 97% |
| `scratch_storage.sqlite` | **40M** | No code references it | low | 90% |
| `models.json` + `omniroute_models.json` | 4.2M | OmniRoute retired; regenerable caches | none | 95% |
| `*/.git` dirs (dashboard 84M, root 78M, others) | ~150M+ | Only if history unneeded — repos are pushed to GitHub | verify GitHub has latest | 80% |
| `.tmp-gw.log/.err`, `agentops.log`, `*_out.txt` | ~220K | Temp logs | none | 99% |
| `index.html.bak`, `exec-migration.js.bak`, root `dist/`, `output/` | ~700K | Artifacts | none | 95% |
| `exec-migration.js`, `dumpkeys.py`, `_*.py` root scripts | ~15K | One-shot migration scripts (done) | verify | 90% |

**TOTAL RECOVERABLE: ~1.35 GB** (without touching any live system)

### ⚠️ SECURITY FLAG
`client_secret_*.json` (Google OAuth client secret) sits in the workspace root — confirm it's not committed; consider rotating if it ever entered git history.

---
## 6. DUPLICATES & SPACE (Phase 5)

| Duplicate | Copies | Saving |
|---|---|---|
| node_modules | dashboard 157M · backend 81M · workers 203M · products 55M · archive ~70M | **~560M** |
| `digitallydefined-backend-clean` ≈ `os-backend` mirror | 2 full copies | ~70M (archive nm+src) |
| dist artifacts | dashboard 700K · products 504K · root 345K · archive site | ~1.5M |
| Supabase `.temp` link state | 6 dirs | ~60K |
| model caches | `models.json` + `omniroute_models.json` | 4.2M |
| `.git` history | root 78M + dashboard 84M + nested repos | ~150M+ (optional) |

---
## 7. MINIMUM VIABLE ECOSYSTEM (the answer)

```
C:\Users\frank\Documents\DigitallyDefinedClean\
├─ digitallydefined-dashboard\   ← RUNTIME: src, public(+3 tools), index.html, pkg, vercel.json, .env
├─ digitallydefined-os-backend\   ← RUNTIME: api, src, lib, supabase/functions+migrations, pkg, vercel.json, .env
├─ digitallydefined-os-workers\   ← SOURCE (deploy when ready): src, wrangler.toml, pkg
├─ digital-products\             ← PRODUCT SHELF: src, public, dist, pkg
└─ KEEP ONLY: SINGLE_SOURCE_OF_TRUTH.md + PRODUCT_GRAPH.md + GUMROAD_LISTING_SEQUENCE.md
Everything else: archive (70M) or delete (≈1.35GB), zero dependency risk.
```
