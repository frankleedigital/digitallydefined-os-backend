# INTEGRATION_MAP.md

**Generated:** 2026-10-19
**Companion to:** `CODEBASE_AUDIT.md`
**Scope:** Connections between `digitallydefined-dashboard`, `digitallydefined-os-backend`, `digitallydefined-os-workers`, `digital-products`, and `digitallydefined-backend-clean`.

---

## 0. The Integration Reality

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  digitallydefined-dashboard │        │  digitallydefined-os-backend │
│  (React + Vite)             │        │  (Vercel Node + Deno + Py)   │
│                             │        │                              │
│  VITE_API_URL ──────────────┼───────►│  api/index.js    ✅ LIVE     │
│  = os-backend.vercel.app    │        │  supabase/functions ✅ LIVE  │
│                             │        │  src/             ❌ ORPHAN  │
│  VITE_SUPABASE_* ───────────┼───┐    │  fastapi/         ❌ BROKEN  │
│  (anon key, RLS)            │   │    │  agents/          ❌ ORPHAN  │
└─────────────────────────────┘   │    │  ai/              ❌ ORPHAN  │
                                  │    └──────────────────────────────┘
                                  │
┌─────────────────────────────┐   │    ┌──────────────────────────────┐
│  digital-products           │   │    │  Supabase project            │
│  (React + Vite + Puter)     │   │    │  dijjlppdljpcgyoakdnq         │
│                             │   │    │  ✅ 13 edge functions         │
│  license.verify ────────────┼───┼───►│  ✅ Postgres + RLS            │
│  (via os-backend)           │   │    │  ✅ Auth (unused)             │
│                             │   │    └──────────────────────────────┘
│  Puter SDK ─────────────────┼───┼───►  Puter cloud (customer storage)
│  (509 kB bundle)            │   │
└─────────────────────────────┘   │
                                  │    ┌──────────────────────────────┐
┌─────────────────────────────┐   │    │  digitallydefined-os-workers │
│  digitallydefined-          │   │    │  (Cloudflare Workers)        │
│  backend-clean              │   │    │                              │
│                             │   │    │  ❌ ZERO references          │
│  .env + LEGACY_INVENTORY.md │   │    │  ❌ Not deployed             │
│  (no code)                  │   │    │  ✅ tsc --noEmit passes       │
└─────────────────────────────┘   │    └──────────────────────────────┘
                                  │
                                  │    ┌──────────────────────────────┐
                                  └───►│  Root supabase/              │
                                       │  ❌ RETIRED (.temp.retired)  │
                                       │  ⚠️  2 functions diverged     │
                                       └──────────────────────────────┘
```

**Summary:** 2 of 5 projects are integrated. 1 is orphaned. 1 is an empty shell. 1 is retired but diverged.

---

## 1. Live Integrations

### 1.1 Dashboard → Backend (Vercel)

**Contract:** `POST {VITE_API_URL}/api` with `{ action, ...payload }` and `x-api-key` header.

**Client:** `dashboard/src/lib/supabase-edge.js` — `callSupabaseEdge(action, payload)`.

**Verified live actions** (referenced by dashboard code):

| Action | Dashboard call site | Backend handler |
|---|---|---|
| `dashboard` | `lib/notion.js:31` | `api/index.js` (inline) |
| `intelligence` | `pages/IntelligencePage.jsx:29` | `api/index.js` (inline) |
| `license.verify` | `lib/premium.js:35` | `supabase/functions/hermes/index.ts` |
| `chat` | `components/ChatWidget.jsx:21` | `api/index.js` (inline) |
| `public.chat` | `pages/AssistantPage.jsx` | `api/index.js` (inline) |
| `hermes.agent` | `pages/DashboardPage.jsx` | `api/index.js` (inline) |
| `automation.list` | `pages/DashboardPage.jsx` | `api/index.js` (inline) |
| `integration.*` (8 actions) | `pages/IntegrationsTab.jsx`, `pages/GrowthTab.jsx` | `api/index.js` (inline) |
| `antigravity` + 6 sub-actions | `pages/AntigravityPage.jsx` | `api/index.js` → `lib/antigravity.js` |
| `website.content` | `pages/DashboardPage.jsx` | `supabase/functions/content` |
| `hermes.getActiveModel` | `lib/modelSelector.js:55` | `api/active-model/index.js` → `src/routes/setModel.js` |
| `hermes.setActiveModel` | `lib/modelSelector.js:100` | `api/set-model/index.js` → `src/routes/setModel.js` |
| `status` | `lib/hermes.js:38` | `api/index.js` (inline) |
| `mentor.dev` | `pages/DashboardPage.jsx` | `api/index.js` (inline) |
| `subscribe` | `components/NewsletterSignup.jsx` | `api/index.js` (inline) |
| `contact` | `pages/ContactUnified.jsx` (deleted) | `api/index.js` (inline) |
| `quiz.complete` | `pages/IntelligencePage.jsx` | `supabase/functions/quiz-submit` |

**Auth:** `x-api-key: {VITE_DASHBOARD_API_KEY}` — a 24-char bearer token **compiled into the client bundle**.

**CORS:** `api/index.js` allows `dashboard.digitallydefined.agency`, `localhost:3000/3001/5173`, and `$VERCEL_URL`.

### 1.2 Dashboard → Supabase (direct)

**Client:** `dashboard/src/supabase.js` — `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`.

**Used for:** `signIn`, `signUp`, `signInWithGoogle`, `signOut`, `profiles` table upsert.

**Status:** ⚠️ The auth flow exists but `App.jsx` has no protected routes using it. `AuthContext.jsx` exists. `ProtectedRoute.jsx` exists. But `App.jsx` renders `<DashboardPage />` directly at `/dashboard` with no `<ProtectedRoute>` wrapper.

**Verified:** `App.jsx:66` → `<Route path="/dashboard" element={<DashboardPage />} />` — **no auth gate**.

### 1.3 digital-products → Backend

**Contract:** `license.verify` via `callSupabaseEdge`.

**Status:** ⚠️ `digital-products/src/lib/` has **no API client**. `ProductShell.jsx` imports only `saveState`, `loadState`, `listRuns`, `loadRun`, `saveRun` from `saveState.js`. The `license.verify` call is **not wired** in the storefront.

**Verified:** `grep -rn "license.verify\|callSupabaseEdge\|VITE_API_URL" digital-products/src` → **0 hits**.

### 1.4 digital-products → Puter

**Client:** `src/lib/puter-cloud.js` (211 LOC) + `@heyputer/puter.js` (509 kB bundle).

**Used for:** `CloudGate.jsx` (auth), `ProductShell.jsx` (save/restore), `saveState.js` (persistence).

**Status:** ✅ Working. This is the only fully-wired integration in the storefront.

### 1.5 Backend → Supabase Edge Functions

**Live functions** (13):

| Function | LOC | Called by |
|---|---|---|
| `hermes` | 1,709 | Dashboard (`license.verify`, `chat`, `mentor.dev`, `notion.*`, `automation.*`, `integration.*`, `website.*`, `quiz.complete`, `hermes.*`) |
| `analytics` | 550 | Dashboard (`lib/analytics.js`) |
| `notion-sync` | 367 | Backend (`api/index.js`) |
| `followup` | 106 | Cron |
| `post-publisher` | 109 | Cron |
| `quiz-submit` | 89 | Dashboard (`quiz.complete`) |
| `quiz-roadmap` | 18 | `quiz-submit` |
| `content` | 72 | Dashboard (`website.content`) |
| `reputation` | 67 | Dashboard |
| `sellable` | 65 | Backend |
| `sync` | 57 | Backend |
| `optimization-loop` | 83 | Cron |
| `optimization-loop-weekly` | 61 | Cron |

### 1.6 Backend → External Services

| Service | Client location | Status |
|---|---|---|
| **OmniRoute** (AI) | `api/index.js` inline, `_shared/omniroute.ts` (424), `src/services/aiRouter.js` (373), `lib/llmClient.js` (292), `fastapi/app/llm.py` (305), `ai/gateway/*` (279) | ⚠️ 6 paths; only `api/index.js` is canonical |
| **Notion** | 19 files across 3 projects | ⚠️ No single client |
| **Brevo** (email) | `src/services/brevo.js`, `_shared/brevo-email.ts` (619), `lib/sync-aggregator.js`, `_shared/sync-aggregator.ts` | ⚠️ 4 paths |
| **Gumroad** (licensing) | `supabase/functions/hermes/index.ts`, `lib/sellable-auth.js`, `_shared/sellable-auth.ts`, `src/services/premium.js` | ⚠️ 4 paths |
| **Facebook** | `api/index.js` (`fetchFacebookGroup`), `lib/sync-aggregator.js`, `_shared/sync-aggregator.ts`, `src/services/facebook.js` (**0 bytes**) | ⚠️ 1 empty file |
| **Google Analytics** | `supabase/functions/analytics/index.ts`, `dashboard/src/lib/integrations/google-analytics.js`, `src/routes/integrationsDispatch.js` | ⚠️ 3 paths |
| **Google Sheets** | `lib/sync-aggregator.js`, `_shared/sync-aggregator.ts`, `src/services/sheets.js` (**0 bytes**) | ⚠️ 1 empty file |
| **SendGrid** | `_shared/email-publish.ts`, `supabase/functions/followup/index.ts` | ❌ Dead (Brevo is live) |
| **Mailchimp** | `dashboard/src/lib/integrations/*` (3 files), `src/routes/integrations.js`, `api/index.js`, `supabase/functions/hermes/index.ts` | ❌ Dead |
| **Vercel API** | `scripts/push-vercel-env.mjs` | ⚠️ Script only |
| **Telegram** | `api/index.js`, `src/config/env.js` | ⚠️ Config only |
| **Discord** | `dashboard/src/lib/integrations/config.js` | ⚠️ Config only |
| **Mighty Networks** | `dashboard/src/lib/integrations/config.js` | ⚠️ Config only |
| **LinkedIn** | `lib/linkedin-publisher.mjs`, `_shared/linkedin-publisher.ts`, `dashboard/src/lib/integrations/social.js` | ⚠️ 3 paths |
| **Instagram** | `lib/instagram-publisher.mjs`, `_shared/instagram-publisher.ts` | ⚠️ 2 paths |
| **Threads** | `lib/threads-publisher.mjs`, `_shared/threads-publisher.ts` | ⚠️ 2 paths |
| **Twitter/X** | `api/index.js`, `dashboard/src/lib/integrations/social.js` | ⚠️ 2 paths |
| **YouTube** | `dashboard/src/lib/integrations/config.js` | ⚠️ Config only |
| **Pinterest** | `src/config/env.js` | ⚠️ Config only |
| **TikTok** | `src/config/env.js` | ⚠️ Config only |
| **Slack** | `src/config/env.js` | ⚠️ Config only |
| **Firecrawl** | `src/config/env.js` | ⚠️ Config only |
| **Antigravity MCP** | `lib/antigravity.js` (315), `src/services/antigravity.js` (511), `os-workers/src/agents/notionArchitect.ts` | ⚠️ 3 paths |
| **Hermes MCP** | `api/hermes-mcp.js`, `lib/hermesMcp.js` (330), `scripts/hermes-mcp-server.mjs` | ⚠️ 3 paths |
| **Cloudflare** | `fastapi/app/config/cloudflare.py` | ❌ Not configured |
| **Vertex AI** | `fastapi/app/config/google.py`, `fastapi/app/llm.py` | ❌ Not installed |
| **OpenRouter** | `src/services/aiRouter.js`, `dashboard/public/customer-config.js` | ❌ Not configured |

---

## 2. Duplicated APIs

### 2.1 The `dashboard` action — 3 implementations

| # | Location | LOC | Status |
|---|---|:--:|---|
| 1 | `api/index.js` (inline, line 973+) | ~650 | ✅ **LIVE** |
| 2 | `src/routes/dashboard.js` | 69 | ❌ Orphaned + **stub** + quoting bug |
| 3 | `src/routes/_original-index-backup.js` | 1,458 | ❌ Frozen copy |

**The orphaned stub returns:**
```json
{ "status": "ok", "message": "Dashboard handler scaffolded - need to migrate full logic" }
```

**The live handler returns:** real metrics, Notion snapshot, Brevo stats, Facebook group stats, Sheets data, AI brief, alerts, env status.

### 2.2 The `chat` action — 2 implementations

| # | Location | Status |
|---|---|---|
| 1 | `api/index.js` (inline) | ✅ LIVE |
| 2 | `src/routes/_original-index-backup.js` | ❌ Frozen |

### 2.3 The `intelligence` action — 2 implementations

| # | Location | Status |
|---|---|---|
| 1 | `api/index.js` (inline) | ✅ LIVE |
| 2 | `src/routes/intelligenceDispatch.js` (199 LOC) | ❌ Orphaned |

### 2.4 The `license.verify` action — 2 implementations

| # | Location | Status |
|---|---|---|
| 1 | `supabase/functions/hermes/index.ts` | ✅ LIVE |
| 2 | `src/services/premium.js` | ❌ Orphaned |

### 2.5 The `automation.*` actions — 2 implementations

| # | Location | Status |
|---|---|---|
| 1 | `api/index.js` (inline) | ✅ LIVE |
| 2 | `src/routes/_original-index-backup.js` | ❌ Frozen |

### 2.6 The `integration.*` actions — 3 implementations

| # | Location | Status |
|---|---|---|
| 1 | `api/index.js` (inline) | ✅ LIVE |
| 2 | `src/routes/integrations.js` + `integrationsDispatch.js` | ❌ Orphaned |
| 3 | `src/routes/_original-index-backup.js` | ❌ Frozen |

### 2.7 The `antigravity.*` actions — 3 implementations

| # | Location | Status |
|---|---|---|
| 1 | `api/index.js` → `lib/antigravity.js` | ✅ LIVE |
| 2 | `src/routes/antigravity.js` | ❌ **3 bytes, corrupt** |
| 3 | `src/services/antigravity.js` (511 LOC) | ❌ Orphaned |

### 2.8 The `website.*` actions — 3 implementations

| # | Location | Status |
|---|---|---|
| 1 | `supabase/functions/content/index.ts` | ✅ LIVE |
| 2 | `api/index.js` (inline, "mirrored for legacy") | ✅ LIVE (mirror) |
| 3 | `src/services/websiteEditor.js` | ❌ **0 references** |

### 2.9 The `quiz.complete` action — 4 implementations

| # | Location | Status |
|---|---|---|
| 1 | `supabase/functions/quiz-submit/index.ts` | ✅ LIVE |
| 2 | `api/index.js` (inline) | ✅ LIVE |
| 3 | `src/agents/quiz.js` | ❌ Orphaned |
| 4 | `workspace/buzz-agents/digital-superpower-quiz/` | ❌ Unmigrated |

---

## 3. Duplicated Logic

### 3.1 Notion access — 19 files

See `CODEBASE_AUDIT.md` §4.4. **No single client.**

### 3.2 Email sending — 4 providers, 12 implementations

See `CODEBASE_AUDIT.md` §4.5. **Brevo is live; Mailchimp, SendGrid, SMTP are dead.**

### 3.3 AI calls — 8 paths

See `CODEBASE_AUDIT.md` §4.6. **OmniRoute is canonical per `api/index.js:146`.**

### 3.4 Social publishing — 5 platforms, 10 implementations

| Platform | Implementations |
|---|---|
| Facebook | `lib/facebook-publisher.mjs`, `_shared/facebook-publisher.ts` (110), `api/index.js` (`fetchFacebookGroup`) |
| Instagram | `lib/instagram-publisher.mjs`, `_shared/instagram-publisher.ts` (114) |
| LinkedIn | `lib/linkedin-publisher.mjs`, `_shared/linkedin-publisher.ts` (136), `dashboard/src/lib/integrations/social.js` |
| Threads | `lib/threads-publisher.mjs`, `_shared/threads-publisher.ts` (118) |
| Twitter/X | `api/index.js`, `dashboard/src/lib/integrations/social.js` |

### 3.5 Agent registries — 3 registries, 25 agents

See `CODEBASE_AUDIT.md` §4.3.

### 3.6 Config loading — 4 implementations

| # | Location | Runtime |
|---|---|---|
| 1 | `src/config/env.js` (565 LOC) | Node |
| 2 | `fastapi/app/config.py` + `config/` package | Python |
| 3 | `os-workers/src/config/env.ts` (73 LOC) | Cloudflare |
| 4 | `dashboard/src/config.js` + `configMerge.js` | Browser |

---

## 4. Unnecessary Calls

### 4.1 Dashboard makes 3 parallel fetches on load

`DashboardPage.jsx` has 3 `fetch` calls in `useEffect` hooks (lines 690, 710, 740, 831). Each is a separate `POST /api` with a different action. No batching.

### 4.2 `hermes/index.ts` makes 13 direct fetches

Each action branch fetches its own data. No request coalescing.

### 4.3 `api/index.js` re-fetches on every call

`fetchNotionSnapshot`, `fetchBrevoStats`, `fetchFacebookGroup`, `fetchSheetsData` are called on every `dashboard` action. Only `aiBriefCache` (20 min) and `brevoCache` (15 min) are cached. Notion, Facebook, and Sheets are **not cached**.

### 4.4 `modelSelector.js` makes 3 sequential calls

`fetchActiveModel()` tries backend → Hermes edge → localStorage. Each is a network round-trip with a 15s timeout. Worst case: 45s before falling back.

### 4.5 `IntelligencePage.jsx` redirects if no quiz data

```js
if (!quizData) { window.location.href = '/quiz'; return; }
```

`/quiz` redirects to `https://digitallydefined.store/quiz`. The user leaves the dashboard, takes the quiz, and returns via `localStorage`. **Two full page navigations.**

---

## 5. Dead Endpoints

### 5.1 Backend actions with no frontend caller

| Action | Handler | Frontend callers |
|---|---|---|
| `ai.recommendations` | `api/index.js` (inline) | **0** — returns hardcoded recommendations |
| `brain.brief` | `api/index.js` (inline) | **0** |
| `automation.logs` | `api/index.js` (inline) | **0** |
| `automation.events` | `api/index.js` (inline) | **0** |
| `automation.run` | `api/index.js` (inline) | **0** |
| `automation.sync` | `api/index.js` (inline) | **0** |
| `test-env` | `api/index.js` (inline) | **0** |
| `contact` | `api/index.js` (inline) | **0** |
| `website.edit` | `api/index.js` (inline) | **0** |
| `hermes.setActiveModel` | `api/set-model/index.js` | **0** (dashboard uses `hermes.getActiveModel` only) |

**Total: 10 of 39 actions have no frontend caller.**

### 5.2 FastAPI routers with no reachable caller

All 13 routers are unreachable due to the `config` import bug. See `CODEBASE_AUDIT.md` §1.3.

### 5.3 os-workers endpoints with no caller

All 9 endpoints (`/api/health`, `/api/templates`, `/api/agents`, `/api/agent/run`, `/api/workspace/build`, `/api/product/factory`, `/api/workspace/audit`, `/api/vectorize/search`, `/api/notion/*`) have **zero references** from any active project.

### 5.4 Supabase edge functions with no caller

| Function | Caller |
|---|---|
| `optimization-loop` | Cron only |
| `optimization-loop-weekly` | Cron only |
| `sync` | Backend (`api/index.js`) — but `api/index.js` has no `sync` action |
| `sellable` | Backend — but `api/index.js` has no `sellable` action |

---

## 6. Broken Integrations

### 6.1 FastAPI ↔ Backend

**Broken.** `api/index.js` proxies `fastapi.*` actions to `FASTAPI_BASE_URL` (default `http://localhost:8000`). FastAPI cannot start. Every `fastapi.*` call fails.

**Verified:**
```
FASTAPI IMPORT FAIL: ImportError cannot import name 'settings' from 'app.config'
```

### 6.2 Dashboard ↔ Supabase Auth

**Broken.** `supabase.js` exports `signIn`, `signUp`, `signInWithGoogle`, `signOut`. `AuthContext.jsx` exists. `ProtectedRoute.jsx` exists. But `App.jsx` renders `<DashboardPage />` with **no auth wrapper**.

**Verified:** `App.jsx:66` → `<Route path="/dashboard" element={<DashboardPage />} />`

### 6.3 digital-products ↔ Backend

**Broken.** The storefront has no API client. `license.verify` is not wired. No product can be gated or verified.

**Verified:** `grep -rn "license.verify\|callSupabaseEdge\|VITE_API_URL" digital-products/src` → 0 hits.

### 6.4 Root `supabase/` ↔ `os-backend/supabase/`

**Diverged.** Two functions differ:

| Function | Diff |
|---|---|
| `quiz-submit` | 4 lines (type annotation) |
| `reputation` | 5 lines (gemini response handling) |

**Risk:** deploying from the root directory ships the older code.

### 6.5 Dashboard ↔ `backend-clean`

**Dead.** `backend-clean` has no code. The dashboard's git history confirms: commit `5fe21b14` — *"fix: point all backend API URLs at digitallydefined-os-backend (backend-clean + api.digitallydefined.agency are dead)"*.

### 6.6 Dashboard ↔ `os-workers`

**Dead.** Zero references.

### 6.7 Backend ↔ Cloudflare / Vertex / OpenRouter

**Not configured.** `fastapi/app/config/cloudflare.py` reads `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` — neither exists in any `.env`. Same for Vertex and OpenRouter.

---

## 7. Missing Integrations

### 7.1 Dashboard → `os-workers`

The Workers service exposes exactly what the dashboard needs: `/api/agents`, `/api/templates`, `/api/workspace/build`, `/api/product/factory`, `/api/workspace/audit`. None are wired.

### 7.2 digital-products → Backend

The storefront needs `license.verify` to gate products. Not wired.

### 7.3 digital-products → Dashboard

The 9 LIVE products map to dashboard components (`RoiCalculator.jsx`, `AssistantPage.jsx`, `AnalyticsPage.jsx`, `NotionTab.jsx`, `components/intelligence/`). The storefront does not embed them.

### 7.4 Backend → `os-workers`

The backend has `antigravity.*` actions. The Workers service has a `notionArchitect` agent. They are separate implementations of the same capability.

### 7.5 Dashboard → Scheduling

The dashboard has `AutomationsTab` and `automation.list`. There is no scheduling layer — `optimization-loop` and `optimization-loop-weekly` run on Supabase cron, but the dashboard cannot create or edit a schedule.

### 7.6 Dashboard → Puter

`digital-products` uses Puter for customer cloud storage. The dashboard does not. A customer's product work (in Puter) and dashboard work (in Supabase/Notion) are in separate silos.

### 7.7 Backend → Vectorize

`os-workers` has a Vectorize index (`dd-template-knowledge`). The backend has `fastapi/app/knowledge.py` and `schemas/*.json`. No connection.

---

## 8. Integration Inventory

### 8.1 By direction

| From → To | Mechanism | Status |
|---|---|---|
| Dashboard → Backend | `POST /api` + `x-api-key` | ✅ Live |
| Dashboard → Supabase | `@supabase/supabase-js` | ⚠️ Client exists, no auth gate |
| Dashboard → Puter | None | ❌ Missing |
| Dashboard → os-workers | None | ❌ Missing |
| Store → Backend | None | ❌ Missing |
| Store → Puter | `@heyputer/puter.js` | ✅ Live |
| Store → Dashboard | None | ❌ Missing |
| Backend → Supabase Edge | `fetch` | ✅ Live |
| Backend → FastAPI | `fetch` | ❌ Broken |
| Backend → os-workers | None | ❌ Missing |
| Backend → External | `fetch` | ⚠️ 20+ services, 4 dead |
| os-workers → Notion | `fetch` | ✅ Live (orphaned) |
| os-workers → Cloudflare AI | Binding | ✅ Live (orphaned) |
| os-workers → Vectorize | Binding | ✅ Live (orphaned) |

### 8.2 By health

| Health | Count |
|---|---|
| ✅ Live and correct | 6 |
| ⚠️ Live but fragile | 8 |
| ❌ Broken | 5 |
| ❌ Missing | 7 |

---

## 9. Integration Priority

| # | Integration | Impact | Effort |
|---|---|---|---|
| 1 | Fix FastAPI ↔ Backend | Unblocks 11 productized tools | **Low** |
| 2 | Wire digital-products → Backend (`license.verify`) | Unblocks the storefront | Low |
| 3 | Add auth gate to Dashboard ↔ Supabase | Security | Low |
| 4 | Reconcile root `supabase/` ↔ `os-backend/supabase/` | Deploy safety | Low |
| 5 | Extract licensing from `hermes/index.ts` | Protects all premium revenue | Medium |
| 6 | Wire Dashboard → os-workers (or retire os-workers) | Resolves 4,837 LOC of ambiguity | Medium |
| 7 | Create `dashboard/src/lib/api.js` | One API surface | Medium |
| 8 | Wire Store → Dashboard (embed components) | Unblocks 9 LIVE products | High |
| 9 | Consolidate 19 Notion clients → 1 | Removes duplication | High |
| 10 | Consolidate 8 AI paths → 1 | Removes duplication | High |
| 11 | Consolidate 4 email providers → 1 | Removes duplication | High |
| 12 | Add scheduling layer | Enables automation revenue | High |
