# REPOSITORY_AUDIT — DigitallyDefinedClean

**Audit date:** 2026-11-07
**Scope:** `C:\Users\frank\Documents\DigitallyDefinedClean` (read-only analysis; no files modified)
**Phase:** Launch & revenue — simplicity over completeness

## Summary Stats

| Metric | Value |
|---|---|
| Top-level items analyzed | 142 (81 root `.md` reports, ~15 folders, ~46 other files) |
| Total folders analyzed (excl. `.git`, incl. node_modules) | 7,474 |
| Total files analyzed (excl. `.git`, `node_modules`, `.venv`) | 1,127 |
| Estimated archive candidates | ~1,350 files (81 root reports + `docs/` historical + `archive/` + `output/` + retired `supabase/` + `Hermes/` + `.agents/` + root `scripts/`) |
| Duplicate assets | 5 duplicate folder trees + 3 duplicated code modules + 2 orphaned route files |
| Obsolete projects | 4 (os-workers Cloudflare tree, root retired `supabase/`, `digitallydefined-backend-clean` stub, `archive/digitallydefined-website-clean`) |

Legend: **KEEP** = directly supports dashboard / backend / products / Gumroad / deployment. **ARCHIVE** = audit docs, reports, old experiments, generated output, scratch. **DELETE CANDIDATE** = duplicates, build artifacts, unreferenced temp. **UNKNOWN** = needs inspection.

---

## Top-Level Classification Table

### Core production repos (KEEP)

| Path | Classification | Purpose | Owner | Last Activity | Production Relevance |
|---|---|---|---|---|---|
| `digitallydefined-dashboard/` | KEEP | React/Vite dashboard + public funnel (quiz, onboarding, store). 105 src files. | Dashboard | 2026-11-04 | **Critical** — quiz lead magnet + storefront + login |
| `digitallydefined-os-backend/` | KEEP | Supabase Edge Functions (15) + unified Vercel `api/index.js` + local `src/` mirror + `vercel.json` rewrites. | Backend | 2026-10-22 | **Critical** — single AI gateway (OmniRoute), quiz scoring, Hermes, notion-sync |
| `digital-products/` | KEEP | Gumroad product launcher (React + Puter.js). 25-product catalog. `dist/` = shippable store bundle. | Products | 2026-10-20 | **Critical** — the storefront; `dist/` is the sold file |
| `docs/` | KEEP (curate) | Active runbooks: `API.md`, `ARCHITECTURE.md`, `DEPLOYMENT_STATE.md`, `RUNBOOKS.md`, `UNIFIED_DEPLOYMENT_CHECKLIST.md`, `supabase-auth-redirects.md` | Ops | 2026-10 | **High** — deployment state + auth redirects are launch-critical; ~60% historical |
| `.gitignore` | KEEP | Ignores `.env*`, `client_secret_*`, `nostr-keypair`, `_*.txt` | Ops | — | **High** — security guardrail |
| `.env.local` | KEEP | Root env: BREVO, DASHBOARD_API_KEY, GEMINI, GUMROAD, NOTION, social tokens | Backend | live | High (gitignored; contains live keys — do not commit) |
| `client_secret_2_…json` | KEEP | Google OAuth client secret (FastAPI/Google flow) | Backend | 2026-09-05 | Medium — needed for Google API calls |
| `index.html` | KEEP | Root landing page (`digitallydefined.online`) | Website | 2026-09-24 | Medium — likely deployed site entry |
| `.vscode/` | KEEP | Editor `settings.json` (preview → `digital-products/index.html`) | Dev | — | Low |
| `workspace/buzz-agents/` | KEEP | Active Buzz agent set (content-repurposer, quiz, facebook-community, json-schema-generator + `lib/`) | Buzz | 2026-10 | Medium — referenced by product `implementation` fields |

### ARCHIVE candidates

| Path | Classification | Purpose | Last Activity |
|---|---|---|---|
| 81 root `.md` reports (list below) | ARCHIVE | Sept–Oct 2026 audit cycle artifacts | 2026-08 → 11-04 |
| `digitallyDefined_CREDENTIAL_REGISTRY.md` | ARCHIVE | Credential registry doc (→ `docs/`) | — |
| `Hermes/skills/digital-wealth-tools/` | ARCHIVE | Agent knowledge docs (brevo-integration, social-handles, verify-website.sh) | 2026-10 |
| `.agents/skills/composio/` | ARCHIVE | Installed composio skill (matches `skills-lock.json`) | 2026-10 |
| `supabase/` (root, 21 files) | ARCHIVE | Retired CLI-linked Supabase tree (`RETIRED.md`); `.temp` renamed `.temp.retired-20261009` to prevent deploys | 2026-10-09 |
| `archive/digitallydefined-website-clean/` | ARCHIVE | Superseded standalone website (has `ARCHIVED.md`) | 2026-08/09 |
| `archive/digitallydefined-backend-clean/` | ARCHIVE | Pre-launch backend copy (~4,478 files incl. node_modules); `.env` present | 2026-10-18 |
| `archive/buzz-agents/` | MERGE→`workspace/` | Older Buzz agent set (5 agents) | 2026-09 |
| `digitallydefined-backend-clean/` (top: `.env` + `LEGACY_INVENTORY.md`) | ARCHIVE | Legacy-inventory stub; real code superseded by os-backend; `.env` is an 11 KB secret | 2026-10-21 |
| `scripts/` (root, 9 files) | ARCHIVE | Buzz/relay deploy + keypair + pipeline scripts (superseded by in-repo scripts) | 2026-09 |
| `_archive.py`, `_inv.py`, `_validate.py` | ARCHIVE | One-off audit/inventory/validation scripts | 2026-10-10 |
| `audit_*.py` ×6 + `audit_*_out.txt`/`audit_*.json` ×6 | ARCHIVE | 2026-10-19/21 audit tooling + outputs (superseded) | 2026-10-21 |
| `dumpkeys.py` | ARCHIVE | SQLite key-table dumper (pairs with `scratch_storage.sqlite`) | 2026-10 |
| `exec-migration.js` (+`.bak`) | ARCHIVE | Supabase REST SQL migration runner + backup copy | 2026-09 |
| `hima.toml` | ARCHIVE | himalaya IMAP/SMTP mail config (agent tooling, not revenue) | — |
| `omniroute-hermes-mcp-config.yaml` | ARCHIVE | Local OmniRoute→Hermes MCP wiring (localhost:20128 only) | 2026-10-15 |
| `index.html.bak` | ARCHIVE | Stale 2026-08-26 copy of root landing page | 2026-08-26 |

### DELETE CANDIDATE (rebuildable / unreferenced / bloat)

| Path | Classification | Reason | Last Activity |
|---|---|---|---|
| `.github/` (2 workflows) | DELETE CANDIDATE | `deploy-dashboard.yml` + `deploy-backend.yml` are both **0-byte** — no CI actually runs | 2026-09-13 |
| `.vercel/` | DELETE CANDIDATE | Vercel CLI link state (stale; deploys come from repo pushes) | — |
| `.venv/` (18,528 files) | DELETE CANDIDATE | Python venv; not source; rebuildable | 2026-10 |
| `dist/` (root, 22 files) | DELETE CANDIDATE | Root-level stale Vite build (QuizPage/RoadmapTool chunks); regenerative | 2026-09-12 |
| `output/` (0 files, 2 empty dirs) | DELETE CANDIDATE | Empty `packages/` + `storage/` | 2026-10-10 |
| `models.json` (2 MB) | DELETE CANDIDATE | Generated OmniRoute/LMAPI model-catalog dump | 2026-10-15 |
| `omniroute_models.json` (2.2 MB) | DELETE CANDIDATE | Same kind of generated model dump | 2026-10-15 |
| `scratch_storage.sqlite` (41 MB) | DELETE CANDIDATE | Agent scratch DB; exposed by `dumpkeys.py` | 2026-10-09 |
| `test.txt` | DELETE CANDIDATE | 28-byte scratch | 2026-09-12 |
| `.tmp-gw.err` / `.tmp-gw.log` | DELETE CANDIDATE | Gateway log capture, **git-tracked** | 2026-09-28 |
| `agentops.log` | DELETE CANDIDATE | AgentOps SDK log (401 errors) | 2026-09-07 |
| `_a/_b/_d/_n/_s/_t1/_t2/_t3.txt` (×9) | DELETE CANDIDATE | 2026-09-12 scratch dumps (55 KB + 169 KB + ~9 KB) | 2026-09-12 |
| `digitallydefined-os-workers/` (45 src files + 2,464 committed node_modules) | DELETE CANDIDATE | Obsolete Notion-automation Cloudflare Workers app; **node_modules committed to root git**; no deploy target in active docs | 2026-10-16 |

### UNKNOWN

| Path | Notes |
|---|---|
| `SAFE_TO_DELETE.md`, `FILES_TO_KEEP/REMOVE/REVIEW.md`, `PRODUCTION_READINESS_AUDIT.md`, `FIRST_DOLLAR_ROADMAP.md` | Decision docs from the cleanup cycle; keep only if still actively consulted, else archive. `PRODUCTION_READINESS_AUDIT` flags unrotated `DASHBOARD_API_KEY` (open item in `docs/DEPLOYMENT_STATE.md`). |
| `digital-products/DIGITAL_PRODUCT_AUDIT.md` (in-repo) | Current product classification source — KEEP. |

---

## Dashboard Deep Dive (`digitallydefined-dashboard`, branch `launch-readiness-fixes`)

**src file count:** 105 files (94 source `.jsx`/`.js` + css + 1 placeholder txt).

### Live routes (from `src/App.jsx`)
`/` (host-conditional → `/dashboard` on dashboard domain, else redirect), `/login`, `/signup`, `/auth/callback`, `/dashboard`, `/quiz`, `/quiz/results`, `/onboarding`, `/intake`, `/review`, `/automations`, `/thank-you-calculator`, `/intelligence`, `/analytics` (dashboard-domain only), `/assistant` (dashboard-domain only), `*` (fallback).

### ⚠️ Dead route in `App.jsx`
- Non-dashboard-domain `homePage` branch does `<Navigate to="/store" replace />` but **no `/store` route exists**; `StorePage.jsx` is imported by nothing. Visitors on preview domains fall through to `*` → `/`. Fix: either re-wire `StorePage` into a `/store` route or point the redirect at `/quiz` (funnel entry).

### Orphaned files (0 external references, verified by grep)
| File | Status |
|---|---|
| `src/pages/StorePage.jsx` | Orphaned — dead-route remnant |
| `src/pages/tabs/AntigravityTab.jsx` | Orphaned — `DashboardPage` uses `pages/AntigravityPage.jsx`, not the Tab variant |
| `src/pages/tabs/NotionTab.jsx` | Orphaned duplicate — `DashboardPage` imports `./NotionTab` (= `pages/NotionTab.jsx`) |
| `src/pages/tabs/placeholder.txt` | Placeholder — remove |
| `src/components/ErrorBoundary.jsx` | 0 refs — never mounted in `main.jsx` |
| `src/components/RoiCalculator.jsx` | 0 refs — ROI calc now in digital-products / backend |
| `src/components/TabNav.jsx` | 0 refs |
| `src/lib/agentRegistry.js` | 0 refs |
| `src/lib/affiliateExport.js` | 0 refs |
| `src/lib/notionConfig.js` | 1 ref (from a Notion module) — verify before touching |

### Duplicate / redundant logic
| Redundancy | Detail |
|---|---|
| **Two API clients** | `src/services/api.js` ("ApiService — single source of truth") AND `src/lib/api-client.js` ("centralized API layer"). Both export `DEFAULT_BASE_URL = https://digitallydefined-os-backend.vercel.app`; `api-client` also carries legacy-URL rewrite logic. Pick one. |
| **Config triplet** | `src/config.js` (static CONFIG) + `src/configMerge.js` (customer-config deep-merge) + `src/config/environment.js` (env validation) — overlapping concerns. |
| **Notion modules** | `src/lib/notion.js`, `src/lib/notionArchitect.js`, `src/utils/notionMapper.js` — three Notion helpers; likely one is legacy. |
| **Logo components** | `Logo.jsx` (6 refs, live) vs `BrandLogo.jsx` (1 ref) + `brand/dd-brand-audit.js` / `dd-brand-tokens.js`. |
| **Unused npm deps** | `@vercel/analytics` and `@vercel/toolbar` in `package.json` with **0 imports** in src (only `@vercel/speed-insights` used in `App.jsx`). Tailwind IS used (`index.css`). |

### Page inventory (22 pages)
DashboardPage, AssistantPage, ThankYouCalculatorPage, IntelligencePage, AnalyticsPage, OnboardingPage, IntakeWizard, ReviewCenter, quiz/QuizPage, quiz/QuizResultsPage, auth/{Login,SignUp,AuthCallback}, GrowthTab, IntegrationsTab, NotionTab, AIStatusPanel, AntigravityPage, StorePage (orphan).

---

## Backend Deep Dive (`digitallydefined-os-backend`, branch `launch-readiness-fixes`)

### Supabase Edge Functions (canonical deploy tree: `supabase/functions/`)
| Function | Role | Status |
|---|---|---|
| `hermes/` | Single AI gateway endpoint (`{SUPABASE}/functions/v1/hermes`), OmniRoute-only | **Live — dashboard's AI path** |
| `quiz-submit/` + `quiz-roadmap/` | Quiz scoring + personalized roadmap | **Live — funnel core** |
| `analytics/` | Live-website analytics + AI recommendations | Live |
| `content/` | Content publishing pipeline | Live |
| `post-publisher/` | Social post publishing (Meta/Threads) | Live |
| `notion-sync/` | Notion DB sync | Live |
| `sync/` | Sync aggregator | Live |
| `followup/` | Brevo follow-up emails | Live |
| `sellable/` | Sellable-asset checks (`sheets-sellable`, `sellable-auth`) | Live (revenue) |
| `reputation/` | Reputation command center | Live |
| `optimization-loop/` + `optimization-loop-weekly/` | Cron-driven optimization | Live |
| `_shared/` (32 modules) | `action-registry`, `ai-client`, `aiRouter`, `omniroute`, social publishers, `notion-*`, `cors-utils`, `http-utils` | Live |

### Vercel API routes (`api/`, deployed via `vercel.json`)
| Route | Status |
|---|---|
| `api/index.js` | **Live — canonical unified handler** (rewrites `/` + `/api`; OmniRoute gateway, rate-limit, FastAPI proxy `fastapi.<sub>`) |
| `api/health.js` | Live — health check |
| `api/hermes-mcp.js` | Live — rewrites `/hermes-mcp` + `/mcp` → MCP server |
| `api/quiz/`, `api/intelligence/`, `api/models/`, `api/set-model/`, `api/active-model/`, `api/business-partner/` | **Orphaned legacy** — pre-unification folders; dashboard now calls the unified `/api` dispatcher (`api/index.js` line 58: businessPartner canonical handler lives in `src/routes/businessPartner.js`) |
| `api/fastapi/[[...path]]/` | Live only while the Python FastAPI service runs (`serve:fastapi` = `cd fastapi && uvicorn`); dev/optional |

### `src/` (local dev mirror + dispatcher)
- `src/index.js` — Express dev server mounting `api/index.js` as middleware.
- `src/routes/` (26): `dispatch.js` + quiz/integrations/intelligence/onboarding dispatch variants, agent routes (niche, product, roadmap, social, trends, scorecard, antigravity, chat, dashboard), `setModel`, `businessPartner`, and **`_original-index-backup.js` (orphaned backup — delete candidate)**.
- `src/agents/` (17), `src/services/` (16), `src/schemas/` (14), `src/workflows/` (3), `src/config/` (4), `src/middleware/` (3), `src/utils/` (6).

### Legacy / contradiction flags inside os-backend
- **`DEPRECATED.md` says this repo is superseded by `digitallydefined-backend-clean` — STALE/WRONG for launch:** the dashboard's canonical base URL is `digitallydefined-os-backend.vercel.app`, and the root `.vercel/repo.json` links the os-backend Vercel project. The DEPRECATED note misleads; supersede it.
- `lib/` (24 legacy helpers, incl. dual `.mjs`/`.js` publisher variants, `hermesMcp.js`, `llmClient.js`) **duplicates** `supabase/functions/_shared/` modules — dual maintenance.
- `agents/` (11 legacy agents), `tools/quiz-store.mjs`, `ai/` (components/gateway/types), `prompts/` (JS + TS + "Master Brain for Notebooklm.txt"), `roadmaps/`, `data/roadmaps`, `openapi.yaml`, `server.ts`, `docker-compose.yml`, `kilo.json`, `supabase-schema.sql`, `tests/aiRouter.failover.test.mjs`, `fastapi/` (Python, `__pycache__` committed) — mixed live/legacy; triage needed before further dev.

---

## Digital Products (`digital-products`)

**Structure:** Vite + React + Puter.js launcher. `index.html` → `src/App.jsx` → `LauncherHome` + `ProductShell` + `CloudGate` + `SaveStatus`. Catalog: `src/lib/products.js` (25 products) wrapped by `productCatalog.js`. Built store: `dist/` (`index.html` + `puter-CDIc_3kb.js` 513 KB + `index-CQjvFOIw.js` 209 KB) — **the sellable Gumroad bundle**. `src/agents/`, `src/calculators/`, `src/tools/`, `public/` are **empty placeholder dirs**.

### Product classification (from `products.js` + in-repo `DIGITAL_PRODUCT_AUDIT.md`)

| # | Product | Catalog Status | Classification |
|---|---|---|---|
| 1 | Digital Superpower Quiz → Personalized Roadmap | LIVE | **NEEDS COMPLETION** (85%; paid checkout + email capture + report download missing) |
| 2 | Niche Profitability Scorecard | LIVE | **NEEDS COMPLETION** (80%; Pro checkout, embed widget, billing, export) |
| 3 | Hermes AI Mentor | LIVE | **NEEDS COMPLETION** (60%; license checkout, subscription mgmt, chat UI) |
| 4 | 10x ROI Calculator | LIVE | **NEEDS COMPLETION** (free lead-capture works; paid full report missing) |
| 5 | Digital Business OS (Notion system) | LIVE | **READY FOR SALE** (existing Gumroad listing `francescaonline.gumroad.com/l/digital-business-os`) |
| 6 | Intelligence Package | LIVE | **READY FOR SALE** (backend + dashboard route exist) |
| 7 | AI Business Partner | LIVE | **READY FOR SALE** (`/ai-partner` + unified API) |
| 8 | Analytics Dashboard + AI Recommendations | LIVE | **READY FOR SALE** |
| 9 | Reputation Command Center + Automation Monitor | LIVE | **READY FOR SALE** |
| 10 | Wealth Calculator | BACKEND | NEEDS COMPLETION (no front-end packaging) |
| 11 | Trends API | BACKEND | NEEDS COMPLETION |
| 12 | Rank-and-Rent Analyzer | BACKEND | NEEDS COMPLETION |
| 13 | Product Generator | BACKEND | NEEDS COMPLETION |
| 14 | Offer Architect | BACKEND | NEEDS COMPLETION |
| 15 | Domain (WHOIS) Analyzer | BACKEND | NEEDS COMPLETION |
| 16 | Authority Blueprint Generator | BACKEND | NEEDS COMPLETION |
| 17 | Asset Plan (Freedom Number + 10x ROI) | BACKEND | NEEDS COMPLETION |
| 18 | Affiliate Flipper | BACKEND | NEEDS COMPLETION |
| 19 | Schema Validator | BACKEND | NEEDS COMPLETION |
| 20 | Hermes MCP | BACKEND | **READY FOR SALE** (MCP server, deployable) |
| 21 | Antigravity MCP | BACKEND | NEEDS COMPLETION |
| 22 | Roadmap Builder | PLACEHOLDER | **ARCHIVE** (coming-soon card) |
| 23 | Product Designer | PLACEHOLDER | **ARCHIVE** |
| 24 | Social Content Pack | PLACEHOLDER | **ARCHIVE** |
| 25 | Trends Explorer | PLACEHOLDER | NEEDS COMPLETION (API built; front-end needed; $19–39/mo target) |

**Verdict:** 5 READY NOW, 15 NEEDS COMPLETION, 3 ARCHIVE, 2 mixed. For the launch-and-revenue phase: sell #5–#9 + #20 immediately; treat the BACKEND bucket as pipeline.

---

## Security Notes (do-not-touch items)
- `digitallydefined-backend-clean/.env` (11 KB, 2026-10-21) and `archive/digitallydefined-backend-clean/.env*` (×3) — secret files; gitignored but on disk.
- `client_secret_*.json` — Google OAuth secret, gitignored, listed in `FILES_TO_KEEP.md` as "do not delete".
- `digitallydefined-os-workers/node_modules` (2,464 files) is **committed in the root git** — untrack it.
- `PRODUCTION_READINESS_AUDIT.md` / `docs/DEPLOYMENT_STATE.md`: `DASHBOARD_API_KEY` + committed `.env` keys still flagged unrotated — open launch item.
