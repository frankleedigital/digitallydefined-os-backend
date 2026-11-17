# CODEBASE_AUDIT.md

**Generated:** 2026-10-19
**Scope:** `digitallydefined-dashboard`, `digitallydefined-os-backend`, `digital-products`, `digitallydefined-os-workers`, `digitallydefined-backend-clean`
**Workspace:** `C:\Users\frank\Documents\DigitallyDefinedClean`
**Method:** Static analysis (AST-free regex + import graph), byte-level inspection, and live build/typecheck/import verification. No files were modified.

---

## 0. Executive Summary

The DigitallyDefined ecosystem is **not one codebase — it is four parallel codebases plus three retired shells**, and the "backend" alone contains **three competing implementations of the same API**.

| Project | Role | Files | LOC | Build/Typecheck | Status |
|---|---|---|---|---|---|
| `digitallydefined-dashboard` | React dashboard | 103 | 17,736 | ✅ `vite build` OK | Active, but 7 empty files + 1 corrupt-adjacent artifact |
| `digitallydefined-os-backend` | Node/Express + FastAPI + Supabase | 331 | 45,224 | ⚠️ `api/index.js` OK; **FastAPI import FAILS** | Active, but 3 parallel API layers |
| `digital-products` | Gumroad storefront | 26 | 6,408 | ✅ `vite build` OK | Active, but **0 of 25 products have a UI** |
| `digitallydefined-os-workers` | Cloudflare Workers | 47 | 4,837 | ✅ `tsc --noEmit` OK | **Orphaned** — zero references |
| `digitallydefined-backend-clean` | "Active backend" per docs | 2 | 698 | ❌ No code at all | **Empty shell** |
| `supabase/` (root) | Retired Supabase functions | 6 | — | — | **Retired**, 2 functions diverged |
| `workspace/buzz-agents` | 5 legacy agents | 5 | — | — | Unmigrated |

**Three findings dominate everything else:**

1. **The FastAPI microservice layer is dead on arrival.** `fastapi/app/main.py` does `from .config import settings`, but Python resolves `app.config` to the **package** `app/config/__init__.py` (which has no `settings`), not the module `app/config.py` (which does). Every FastAPI route is unreachable. Verified: `ImportError: cannot import name 'settings' from 'app.config'`.

2. **The backend has three parallel API implementations.** `api/index.js` (1,627 LOC, Vercel, 27 action branches) is the only live path. `src/routes/` (20 files, 3,350 LOC) is a **second, orphaned implementation** — `src/routes/dispatch.js` has **zero importers**, and `src/index.js` mounts `api/index.js` directly, bypassing `src/routes/` entirely. `src/routes/_original-index-backup.js` (1,458 LOC) is a **third**, frozen copy of `api/index.js`.

3. **`digital-products` is a catalog, not a store.** 25 products are declared in `src/lib/products.js`. **Zero define `renderBody`.** Every product route renders `ProductBodyFallback` — a placeholder that says "Connect the {product.id} implementation here." The storefront is a directory of 25 empty boxes.

---

## 1. Architecture Problems

### 1.1 Three competing backend implementations

```
digitallydefined-os-backend/
├── api/index.js                 ← LIVE (Vercel). 1,627 LOC. 27 action branches. Only entry.
├── src/routes/                  ← ORPHANED. 20 files, 3,350 LOC.
│   ├── dispatch.js              ← 307 LOC catch-all. ZERO importers.
│   ├── dashboard.js             ← 2,398 bytes. SCAFFOLD + BUG (see 1.2).
│   ├── _original-index-backup.js← 1,458 LOC frozen copy of api/index.js. ZERO importers.
│   └── index.js                 ← ROUTES map. ZERO importers.
├── src/agents/                  ← reachable ONLY via src/routes/ → therefore orphaned
├── src/services/                ← reachable ONLY via src/routes/ → therefore orphaned
├── src/schemas/                 ← reachable ONLY via src/agents/ → therefore orphaned
└── src/workflows/               ← reachable ONLY via src/routes/ → therefore orphaned
```

**Proof of orphaning:**
- `grep -rn "routes/dispatch\|handleDispatch"` → only a comment in `api/index.js:76`.
- `grep -rn "routes/index"` → zero hits outside the file itself.
- `src/index.js:36-37` → `import handler from '../api/index.js'; app.use((req,res) => handler(req,res));` — the Express server **mounts the Vercel handler directly**. `src/routes/` is never reached.

**Consequence:** ~3,350 LOC of route handlers, ~1,500 LOC of agents, ~1,200 LOC of services, ~800 LOC of schemas, and ~600 LOC of workflows are **dead code that still gets read, maintained, and mistaken for the live path**. An AI agent asked to "fix the dashboard action" has a 50% chance of editing a file that never executes.

### 1.2 `src/routes/dashboard.js` — scaffold + quoting bug

```js
const ALLOWED_ACTIONS = new Set([
  '"status"', '"auth.verify"', '"test-env"', '"dashboard"',   // ← double-quoted strings
  ...
]);
```

Every entry is a string **containing literal quote characters**. `ALLOWED_ACTIONS.has('dashboard')` returns `false`; `ALLOWED_ACTIONS.has('"dashboard"')` returns `true`. The set can never match a real action name.

The same file's handler is an explicit scaffold:

```js
export async function handleDashboard(req, res) {
  if (!checkDashboardApiKey(req)) { return res.status(401).json({ error: 'Unauthorized' }); }
  // TODO: Add full dashboard logic from api/index.js lines 1197-1335
  return res.status(200).json({ status: 'ok', message: 'Dashboard handler scaffolded - need to migrate full logic' });
}
```

This is the **canonical `dashboard` action** — the one the dashboard calls on load. In the orphaned tree it returns a stub. In the live tree (`api/index.js`) it is fully implemented. Two different answers to the same question, and the stub is the one an agent will find first.

### 1.3 FastAPI layer is structurally unreachable

```
fastapi/app/
├── config.py          ← defines `settings = get_settings()` (line 74)
└── config/            ← PACKAGE. __init__.py re-exports constants, NOT settings.
    └── __init__.py    ← "Backward-compatible: `from .config import settings` still works"
```

Python resolves `app.config` to the **package** (packages win over same-named modules). `app/config/__init__.py` never defines `settings`. Therefore:

- `app/main.py:15` → `from .config import settings` → **ImportError**
- `app/deps.py:7`, `app/llm.py:27`, `app/storage.py:14`, `app/services/product_packager.py:15` → same failure
- All 13 `include_router` calls in `main.py` are unreachable
- All 11 routers, 9 services, 12 models are unreachable

**Verified live:**
```
FASTAPI IMPORT FAIL: ImportError cannot import name 'settings' from 'app.config'
  (C:\...\fastapi\app\config\__init__.py)
app.config resolved to: ...\fastapi\app\config\__init__.py
```

The docstring in `config/__init__.py` claims backward compatibility that does not exist. This is the single highest-severity defect in the backend.

### 1.4 `digital-products` has no products

```js
// src/components/ProductShell.jsx:90
{typeof product.renderBody === 'function'
  ? product.renderBody(contextValue)
  : <ProductBodyFallback product={product} />}
```

`grep -c "renderBody" src/lib/products.js` → **0**. All 25 products fall to `ProductBodyFallback`, which renders:

> *"Connect the {product.id} implementation here. Cloud save and restore are wired automatically — call `save(state)` from the injected context to persist work into the customer's own Puter drive."*

The catalog is well-structured (id, name, tagline, description, category, status, audience, monetization, route, implementation) and the shell is well-built (CloudGate auth, SaveStatus, run history). But **no product has a body**. The storefront is a launcher for 25 placeholders.

### 1.5 `digitallydefined-os-workers` is orphaned

47 files, 4,837 LOC, `tsc --noEmit` passes, `wrangler.toml` is fully configured (AI binding, Vectorize index, Durable Object). It exposes `/api/health`, `/api/templates`, `/api/agents`, `/api/agent/run`, `/api/workspace/build`, `/api/product/factory`, `/api/workspace/audit`, `/api/vectorize/search`, `/api/notion/*`.

**Zero references** from `digitallydefined-dashboard/src`, `digitallydefined-dashboard/public`, `digitallydefined-os-backend/api`, `digitallydefined-os-backend/src`, `digitallydefined-os-backend/lib`, or `digital-products/src`. It is a complete, working, **unconnected** service.

### 1.6 `digitallydefined-backend-clean` is an empty shell

Contains exactly two files: `.env` and `LEGACY_INVENTORY.md`. No `package.json`, no source, no build.

Yet `digitallydefined-os-backend/README.md` says:

> *"This project is no longer the place to add new backend features. New work goes in `digitallydefined-backend-clean/`, which is the active, deployed backend."*

And `DEPRECATED.md` says the same. **The documented "active backend" does not exist.** The dashboard's git history confirms the reversal: commit `5fe21b14` — *"fix: point all backend API URLs at digitallydefined-os-backend (backend-clean + api.digitallydefined.agency are dead)"*. The docs were never updated.

---

## 2. Technical Debt

### 2.1 Dead and empty files (verified by byte count)

| File | Size | Evidence |
|---|---|---|
| `os-backend/src/routes/antigravity.js` | **3 bytes** (`@\r\n`) | `node --check` → `SyntaxError: Invalid or unexpected token` |
| `os-backend/src/services/facebook.js` | **0 bytes** | — |
| `os-backend/src/services/sheets.js` | **0 bytes** | — |
| `dashboard/src/components/ErrorBoundary.jsx` | **0 bytes** | — |
| `dashboard/src/components/TabNav.jsx` | **0 bytes** | — |
| `dashboard/src/lib/api.js` | **0 bytes** | — |
| `dashboard/src/lib/hooks/useIntegrations.js` | **0 bytes** | — |
| `dashboard/src/lib/hooks/useSync.js` | **0 bytes** | — |
| `dashboard/src/pages/tabs/AntigravityTab.jsx` | **0 bytes** | — |
| `dashboard/src/pages/tabs/NotionTab.jsx` | **0 bytes** | — |
| `dashboard/dev/null` | **823 LOC** | A minified JS bundle committed as `dev/null` |

`dashboard/src/pages/tabs/placeholder.txt` is a placeholder directory marker. Note `DashboardPage.jsx:38` imports `./NotionTab` (the 303-LOC real one), **not** `./tabs/NotionTab` (the empty one) — so the empty file is harmless but confusing.

### 2.2 Orphaned modules with zero importers

| Module | LOC | Importers |
|---|---|---|
| `os-backend/src/routes/dispatch.js` | 307 | **0** |
| `os-backend/src/routes/index.js` | 52 | **0** |
| `os-backend/src/routes/_original-index-backup.js` | 1,458 | **0** |
| `os-backend/src/routes/fastapiDispatch.js` | 88 | **0** |
| `os-backend/src/routes/integrationsDispatch.js` | 364 | **0** |
| `os-backend/src/routes/intelligenceDispatch.js` | 199 | **0** |
| `os-backend/src/routes/onboardingDispatch.js` | 55 | **0** |
| `os-backend/src/routes/quizDispatch.js` | 166 | **0** |
| `os-backend/src/services/index.js` | — | **0** |
| `os-backend/src/services/facebook.js` | 0 | **0** |
| `os-backend/src/services/sheets.js` | 0 | **0** |
| `os-backend/src/services/websiteEditor.js` | — | **0** |

### 2.3 Documentation that contradicts the code

| Document | Claim | Reality |
|---|---|---|
| `os-backend/README.md` | "New work goes in `backend-clean/`, the active deployed backend" | `backend-clean/` has no code |
| `os-backend/DEPRECATED.md` | "superseded by `backend-clean`" | Same |
| `ACTIVE_DEPENDENCY_MAP.md` | `os-workers` = LEGACY/NO | Correct, but `backend-clean` = LEGACY/NO while `README.md` says ACTIVE |
| `POST_CLEANUP_ARCHITECTURE.md` | "3 active projects" | Correct, but omits that FastAPI is broken |
| `api/index.js:92` | "Kept in sync with `action-registry.ts` (single source of truth)" | `action-registry.ts` has 42 strings incl. `agent.`, `fastapi.`, `routes` — **not** a 1:1 match |
| `config/__init__.py:3` | "`from .config import settings` still works via re-export" | It does not |

### 2.4 Secret exposure

`digitallydefined-dashboard/.env` ships **server-side credentials to the browser** via `VITE_` prefix:

| Variable | Length | Classification |
|---|---|---|
| `VITE_DASHBOARD_API_KEY` | 24 | **Real secret** — bearer token compiled into client JS |
| `VITE_BREVO_API_KEY` | 89 | **Real secret** — email provider key |
| `VITE_SUPABASE_ANON_KEY` | 208 | Public by design (RLS-protected) |
| `VITE_FACEBOOK_ACCESS_TOKEN` | 0 | Empty |
| `VITE_INSTAGRAM_ACCESS_TOKEN` | 0 | Empty |

`digitallydefined-dashboard/.env.local` is **tracked in git** (`git ls-files` confirms) despite `.gitignore` line 7 listing `.env*`. The file was committed before the rule landed; git keeps tracking it. `INTEGRATION_INVENTORY.md` §F1 documents this as a known finding.

---

## 3. Oversized Files

| File | LOC | Problem |
|---|---|---|
| `os-backend/supabase/functions/hermes/index.ts` | **1,709** | 28 action branches, 13 fetches, 4 TODOs. One function is the entire AI surface. |
| `os-backend/api/index.js` | **1,627** | 27 action branches, 25 `action ===` comparisons, all handlers inline. |
| `os-backend/src/routes/_original-index-backup.js` | **1,458** | Frozen duplicate of `api/index.js`. |
| `dashboard/src/pages/DashboardPage.jsx` | **1,526** | 20 `useState`, 101 inline style objects, 13 tab components in one file. |
| `os-backend/supabase/functions/_shared/sync-aggregator.ts` | **788** | Duplicated verbatim as `lib/sync-aggregator.js`. |
| `os-backend/supabase/functions/_shared/notion-architect.ts` | **637** | Duplicated as `lib/notion-architect.js` (896 diff lines). |
| `os-backend/supabase/functions/_shared/brevo-email.ts` | **619** | Root `supabase/functions/_shared/brevo-email.ts` is a 55-LOC stub of this. |
| `dashboard/src/index.css` | **705** | 35 `!important`, 6 `box-shadow`, 2 `border-radius` — brand-rule violations. |
| `dashboard/src/config.js` | **446** | Brand tokens + metrics + community + contact in one file. |
| `os-backend/src/config/env.js` | **565** | 58 inline arrow functions; every env var hand-mapped. |
| `dashboard/dev/null` | **823** | Minified bundle committed as a file named `null`. |

---

## 4. Duplicate Functionality

### 4.1 Verbatim file duplication

| Module | Node copy | Deno copy | Diff |
|---|---|---|---|
| `sync-aggregator` | `lib/sync-aggregator.js` (788) | `_shared/sync-aggregator.ts` (788) | **76 lines** (env access only) |
| `notion-architect` | `lib/notion-architect.js` | `_shared/notion-architect.ts` | **896 lines** |
| `notion-client` | `lib/notion-client.js` (59) | `_shared/notion-client.ts` (59) | **8 lines** |
| `notion-schema` | `lib/notion-schema.js` | `_shared/notion-schema.ts` | **10 lines** |
| `notion-write` | `lib/notion-write.js` | `_shared/notion-write.ts` | **120 lines** |

Plus `.mjs` variants: `lib/notion-client.mjs` (116 LOC) and `lib/notion-write.mjs` — **different implementations** of the same functions, not copies.

### 4.2 Duplicate function names across projects

| Function | Definitions | Locations |
|---|---|---|
| `fetchBrevoStats` | **5** | `api/index.js`, `lib/sync-aggregator.js`, `src/routes/_original-index-backup.js`, `src/services/integrations.js`, `_shared/sync-aggregator.ts` |
| `safeNumber` | **5** | `api/index.js`, `lib/sync-aggregator.js`, `_original-index-backup.js`, `src/utils/formatters.js`, `_shared/sync-aggregator.ts` |
| `fetchGoogleAnalytics` | **3** | `dashboard/.../google-analytics.js`, `dashboard/.../integrations.js`, `os-backend/src/routes/integrationsDispatch.js` |
| `getAgent` | **3** | `agents/buzz-registry.js`, `agents/index.js`, `src/agents/index.js` |
| `verifyLicense` | **2** | `dashboard/src/lib/premium.js`, `os-backend/src/services/premium.js` |
| `sendEmail` | **2** | `src/services/brevo.js`, `_shared/email-publish.ts` |
| `fetchNotionSnapshot` | **2** | `api/index.js`, `_original-index-backup.js` |
| `normalizeProperties` | **2** | `dashboard/src/utils/notionMapper.js`, `os-backend/src/services/antigravity.js` |
| `fetchSocialStats` | **2** | `dashboard/.../integrations.js`, `dashboard/.../social.js` |

### 4.3 Duplicate agent registries

- `os-backend/agents/index.js` — 9 agents (hermes_brand_builder, hermes_quality_assurance, digital_superpower, roadmap, audience_insight, competition_analyzer, trend_analyzer, opportunity_scanner, affiliate_flip)
- `os-backend/src/agents/index.js` — 10 agents (niche, roadmap, scorecard, product, social, trends, competition, opportunities, audience, quiz)
- `os-workers/src/agents/index.ts` — 6 agents (notion_architect, template_builder, content, planner, researcher, product_publisher)

Three registries, three different agent sets, three different runtimes. `roadmap` exists in all three.

### 4.4 Duplicate Notion clients

19 files across 3 projects touch `api.notion.com`:
`api/index.js`, `fastapi/app/notion_architect.py`, `lib/antigravity.js`, `lib/notion-client.js`, `lib/notion-client.mjs`, `lib/sync-aggregator.js`, `scripts/notion-architect-reconcile.mjs`, `src/config/constants.js`, `src/config/env.js`, `src/routes/_original-index-backup.js`, `supabase/functions/hermes/index.ts`, `supabase/functions/notion-sync/index.ts`, `_shared/notion-client.ts`, `_shared/notion-write.ts`, `_shared/sync-aggregator.ts`, `os-workers/scripts/smoke-test.mjs`, `os-workers/src/agents/notionArchitect.ts`, `os-workers/src/api/routes.ts`, `os-workers/src/config/env.ts`, `os-workers/src/notion/client.ts`.

### 4.5 Duplicate email providers

| Provider | Implementations |
|---|---|
| Brevo | `src/services/brevo.js`, `_shared/brevo-email.ts` (619 LOC), `lib/sync-aggregator.js`, `_shared/sync-aggregator.ts`, `src/routes/integrationsDispatch.js`, `api/index.js` |
| Mailchimp | `dashboard/src/lib/integrations/config.js`, `dashboard/.../email.js`, `dashboard/.../integrations.js`, `dashboard/src/pages/GrowthTab.jsx`, `os-backend/src/routes/integrations.js`, `api/index.js`, `supabase/functions/hermes/index.ts` |
| SendGrid | `_shared/email-publish.ts`, `supabase/functions/followup/index.ts` |
| SMTP | `src/services/brevo.js`, `_shared/brevo-email.ts` |

Four email paths. `INTEGRATION_INVENTORY.md` confirms Brevo is the live provider; Mailchimp and SendGrid are dead.

### 4.6 Duplicate AI routers

`src/services/aiRouter.js` (373 LOC), `supabase/functions/_shared/omniroute.ts` (424 LOC), `supabase/functions/_shared/aiRouter.ts` (39 LOC), `fastapi/app/llm.py` (305 LOC), `lib/llmClient.js` (292 LOC), `ai/gateway/router.ts` (100 LOC), `ai/gateway/client.ts` (179 LOC), `api/index.js` (inline `AI_PROVIDERS`).

Eight AI-call paths. `api/index.js:146-155` declares **OmniRoute ONLY** ("All AI calls go through OmniRoute"). The other seven are dead or divergent.

---

## 5. Unnecessary Complexity

### 5.1 `configMerge.js` — runtime white-label merge

134 LOC that maps `window.DD_CUSTOMER_CONFIG` keys to internal config paths, deep-merges, and exposes `window.__DD_CONFIG_MERGED` / `window.__DD_CONFIG_CUSTOMER` "for debugging (remove in production)". The dashboard is not white-labeled in production; this is speculative infrastructure.

### 5.2 `customer-config.js` — 191 LOC of white-label defaults

`dashboard/public/customer-config.js` is a hand-editable config file loaded via script tag. Combined with `configMerge.js`, the dashboard carries a white-label system with no white-label customers.

### 5.3 `dev/null` — 823 LOC of minified JS

A Vite build artifact committed under a file named `null`. It is not imported by anything.

### 5.4 `src/routes/_original-index-backup.js` — 1,458 LOC frozen copy

A backup of `api/index.js` kept in the source tree. It is not imported, not referenced, and diverges from the live file.

### 5.5 Root `supabase/` — retired but diverged

```
supabase/functions/          ← retired (.temp.retired-20261009)
├── content/index.ts         ← identical to os-backend version
├── quiz-roadmap/index.ts    ← identical
├── quiz-submit/index.ts     ← 4-line diff (type annotation)
├── reputation/index.ts      ← 5-line diff (gemini response handling)
├── omniroute/index.ts       ← 25 LOC test stub, not in os-backend
└── _shared/brevo-email.ts   ← 55 LOC stub vs 619 LOC in os-backend
```

Two functions have **silently diverged** from their canonical copies. A deploy from the wrong directory ships the wrong code.

---

## 6. Tightly Coupled Components

### 6.1 `DashboardPage.jsx` — 13 tabs, one file

```
DashboardPage.jsx (1,526 LOC)
├── MetricCard, InfoBlock, EmptyState          (presentational)
├── CommandTab, ReputationTab, IntelTab        (tab components)
├── BrainTab, AutomationsTab, DashboardAssistant
├── GrowthTab, IntegrationsTab, NotionTab      (imported)
├── AntigravityPage                            (imported)
├── 20 useState hooks
├── 101 inline style objects
└── 3 fetch calls
```

`renderTab()` is a 9-branch `if` chain returning a different component per tab. Every tab shares one state object, one loading gate, and one error boundary. Adding a tab requires editing the 1,526-LOC file.

### 6.2 `api/index.js` — 27 action branches, one function

`handler(req, res)` at line 973 is a single 650-LOC function with 27 `action ===` branches and 3 `action.startsWith` branches. Each branch inlines its own auth check, its own fetch, its own error handling, and its own response shape. There is no handler registry — `src/routes/index.js` defines one (`ROUTES` map) but nothing imports it.

### 6.3 `hermes/index.ts` — 28 action branches, one function

Same pattern: 1,709 LOC, 28 `action ===` branches, 13 fetches, 4 TODOs. The AI surface (chat, mentor, intelligence, quiz, automation, integrations, website, antigravity, license) is one function.

### 6.4 `config.js` + `configMerge.js` + `theme.js` — three-way coupling

`theme.js` imports both `config.js` and `configMerge.js`. `configMerge.js` imports `config.js`. Every component imports `theme.js`. A change to `config.js` propagates through `configMerge.js` → `theme.js` → every component.

---

## 7. Confusing Folder Structures

### 7.1 `os-backend` — four parallel trees

```
os-backend/
├── api/            ← Vercel serverless (LIVE)
├── src/            ← Express (ORPHANED — mounts api/index.js, so src/routes never runs)
├── lib/            ← Node helpers (partially live: antigravity.js, llmClient.js)
├── agents/         ← Node agent registry (ORPHANED — nothing imports it)
├── ai/             ← TS AI gateway (ORPHANED)
├── fastapi/        ← Python (BROKEN IMPORT)
├── supabase/       ← Deno edge functions (LIVE)
├── schemas/        ← JSON schemas (orphaned)
├── prompts/        ← System prompts (orphaned)
├── roadmaps/       ← Roadmap store (orphaned)
├── tools/          ← quiz-store.mjs (orphaned)
├── data/           ← roadmaps/ (orphaned)
├── scripts/        ← 24 scripts (partially live)
└── docs/           ← 2 docs
```

A developer cannot tell from the folder names which tree is live. `src/` looks like the source; it is not.

### 7.2 `dashboard/src` — duplicate `tabs/` and `pages/`

```
dashboard/src/pages/
├── NotionTab.jsx          ← 303 LOC, REAL, imported by DashboardPage
├── GrowthTab.jsx          ← 222 LOC, REAL
├── IntegrationsTab.jsx    ← 195 LOC, REAL
└── tabs/
    ├── NotionTab.jsx      ← 0 bytes, EMPTY
    ├── AntigravityTab.jsx ← 0 bytes, EMPTY
    └── placeholder.txt
```

Two `NotionTab.jsx` files. One works, one is empty. `DashboardPage.jsx:38` imports the working one; an agent scanning `pages/` will find both.

### 7.3 `dashboard/src/lib` — empty files that look like modules

`lib/api.js` (0 bytes), `lib/hooks/useIntegrations.js` (0 bytes), `lib/hooks/useSync.js` (0 bytes). An agent importing `../lib/api` gets `undefined`.

### 7.4 Root workspace — 15 top-level directories, 3 active

```
DigitallyDefinedClean/
├── digitallydefined-dashboard/     ACTIVE
├── digitallydefined-os-backend/    ACTIVE
├── digital-products/               ACTIVE
├── digitallydefined-os-workers/    ORPHANED
├── digitallydefined-backend-clean/ EMPTY SHELL
├── supabase/                       RETIRED
├── workspace/buzz-agents/          UNMIGRATED
├── docs/                           14 files, mixed status
├── output/                         build artifacts
├── scripts/                        8 scripts
├── Hermes/skills/                  1 dir
├── dist/                           build artifact
├── archive/                        archive
├── .hermes/, .agents/, .kilo/, .vercel/, .vscode/, .github/  IDE/CI
└── index.html, hima.toml, models.json, *.py, *.txt, *.md       loose files
```

---

## 8. Hardcoded Values

### 8.1 URLs

| Value | Files |
|---|---|
| `https://dijjlppdljpcgyoakdnq.supabase.co` | `dashboard/src/components/ChatWidget.jsx`, `dashboard/src/lib/hermes.js`, `os-backend/fastapi/app/config.py`, `fastapi/app/config/supabase.py`, `lib/supabaseClient.js`, `src/config/env.js` |
| `https://digitallydefined-os-backend.vercel.app` | `dashboard/public/customer-config.js`, `dashboard/src/lib/modelSelector.js`, `dashboard/src/lib/supabase-edge.js`, `dashboard/src/lib/integrations/integrations.js` |
| `https://francescaonline.gumroad.com` | `dashboard/public/10x-roi-calculator.html` (×2), `dashboard/public/affiliate-flip-calculator.html`, `dashboard/src/config.js` (×2), `os-backend/fastapi/app/data/products.py` (×14) |
| `DigitallyDefined-OS-2026` (API key) | `dashboard/src/lib/hermes.js`, `dashboard/src/pages/DashboardPage.jsx`, `os-backend/fastapi/app/config.py`, `fastapi/app/data/migration_report.py`, `os-backend/scripts/push-vercel-env.mjs` |
| `localhost:3000/3001/20128` | `os-backend` — **81 occurrences across 28 files** |

### 8.2 Notion database IDs

6 UUIDs hardcoded in `os-backend/scripts/bootstrap.cjs`. 11 files reference `NOTION_*_DB_ID` env vars. The dashboard reads 7 `VITE_NOTION_*_DB_ID` vars; 4 of them are **empty strings** in `.env` (`PUBLISHING_QUEUE`, `CONTENT_APPROVALS`, `BUYER_SIGNALS`, `AI_CONTENT_DRAFTS`).

### 8.3 Price points

| Price | Files |
|---|---|
| `$97` | `os-backend/fastapi/app/data/products.py`, `fastapi/app/services/asset_plan_service.py`, `os-backend/src/agents/product.js`, `digital-products/src/lib/products.js` |
| `$27` | `os-backend/fastapi/app/data/products.py`, `os-backend/src/agents/product.js`, `digital-products/src/lib/products.js`, `dashboard/public/10x-roi-calculator.html` |
| `$47` | `os-backend/src/agents/opportunities.js`, `dashboard/public/10x-roi-calculator.html` |
| `$49` | `os-backend/src/agents/opportunities.js`, `digital-products/src/lib/products.js` |
| `$297` | `os-backend/fastapi/app/data/products.py` |
| `$497` | `os-backend/src/agents/opportunities.js` |
| `$19`, `$29`, `$39`, `$67` | `digital-products/src/lib/products.js` |
| `$48` | `dashboard/src/config.js`, `os-backend/lib/sync-aggregator.js`, `_shared/sync-aggregator.ts` |
| `$12` | `os-backend/supabase/functions/hermes/index.ts` |
| `$675`, `$65` | `dashboard/public/10x-roi-calculator.html` |

**No single source of truth for pricing.** The same product is priced differently in `products.js`, `products.py`, and the dashboard HTML.

### 8.4 Dashboard metrics

`dashboard/src/config.js` hardcodes:
```js
metrics: {
  assetValue: "$48,000",
  systemHealth: "100%",
  sentimentIndex: "Positive",
  communityCount: "1,284",
  reviewConversionRate: "24.8%",
  activeLeads: "1,284",
}
```

These render as live metrics. They are constants.

---

## 9. Missing Abstractions

| Missing | Consequence |
|---|---|
| **Action handler registry** | 27 branches in `api/index.js`, 28 in `hermes/index.ts`. `src/routes/index.js` has a `ROUTES` map that nothing imports. |
| **Notion client** | 19 files call `api.notion.com` directly. |
| **Email provider interface** | 4 providers, 12 implementations. |
| **AI router interface** | 8 AI-call paths. |
| **Config module** | `config.js` + `configMerge.js` + `theme.js` + `index.css` + `customer-config.js` — 5 places brand tokens live. |
| **Type definitions** | `os-backend/src/types/` is **empty**. `os-workers/src/types.ts` (226 LOC) is the only typed contract, and it belongs to an orphaned project. |
| **Shared UI primitives** | `dashboard/src/components/ui/` exists; `dashboard/src/components/intelligence/` has 10 view components with no shared primitives. |
| **Product body contract** | `ProductShell` expects `product.renderBody(context)`; no product implements it; no type documents the context shape. |
| **API client** | `dashboard/src/lib/api.js` is **0 bytes**. Every page hand-rolls `fetch` with `getSupabaseEdgeUrl()` + `getSupabaseEdgeHeaders()`. |
| **Error boundary** | `dashboard/src/components/ErrorBoundary.jsx` is **0 bytes**. |

---

## 10. Runtime Inefficiencies

### 10.1 Dashboard render cost

`DashboardPage.jsx`: 20 `useState`, 1 `useMemo`, **0 `useCallback`**, 101 inline style objects. Every re-render recreates 101 style objects and re-renders all 9 tabs (only one is visible). `renderTab()` is called on every render.

### 10.2 Bundle size

```
dashboard:  index-B2D8V1Ya.js   539.02 kB  (gzip 155.33 kB)
            index-DAH_J82l.css   18.70 kB
digital-products:
            index-CQjvFOIw.js   209.22 kB
            puter-CDIc_3kb.js   509.26 kB  ← Puter SDK is 70% of the storefront bundle
```

Both builds emit the >500 kB chunk warning. Neither uses code splitting.

### 10.3 Backend fetch patterns

`api/index.js` has 1 `fetch(` but 13 `fetchWithTimeout` calls inside helpers. `hermes/index.ts` has 13 direct `fetch` calls. Neither has request coalescing; concurrent dashboard tabs trigger parallel identical calls.

### 10.4 CSS specificity war

`dashboard/src/index.css` uses **35 `!important`** declarations to force brand rules:
```css
border-radius: var(--dd-radius) !important;
box-shadow: none !important;
background: var(--dd-surface) !important;
border: 1px solid var(--dd-border) !important;
```
Plus 6 `box-shadow` and 2 `border-radius` declarations that **violate the brand rules** the file enforces:
```css
box-shadow: 0 0 0 3px rgba(241, 139, 37, 0.15);   /* line 589 */
border-radius: 50%;                                /* line 613 */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);        /* line 636 */
box-shadow: 0 0 0 0 rgba(241,139,37,0.4);          /* line 677 */
box-shadow: 0 0 0 8px rgba(241,139,37,0);          /* line 678 */
```

The brand spec says "NEVER use box-shadows" and "NEVER use border-radius higher than 0px". The CSS enforces this with `!important` in one place and violates it in five others.

---

## 11. Verification Log

| Check | Command | Result |
|---|---|---|
| Dashboard build | `npm run build` | ✅ 1,922 modules, 7.92s |
| Digital-products build | `npm run build` | ✅ 272 modules, 5.80s |
| os-workers typecheck | `npx tsc --noEmit` | ✅ exit 0 |
| os-backend `api/index.js` syntax | `node --check` | ✅ OK |
| os-backend `lib/` syntax | `node --check` (all) | ✅ OK |
| os-backend `agents/` syntax | `node --check` (all) | ✅ OK |
| os-backend `src/` syntax | `node --check` (all) | ❌ `src/routes/antigravity.js` — 3 bytes, `SyntaxError` |
| FastAPI import | `python -c "from app.main import app"` | ❌ `ImportError: cannot import name 'settings' from 'app.config'` |
| FastAPI deps | `pip list` (vertexai, firestore, storage, bigquery) | ❌ Not installed (warnings on import) |
| Duplicate content | SHA1 of all code files | 0 identical-byte groups (duplication is structural, not byte-level) |
| Orphan detection | import-graph grep | 12 modules with 0 importers |

---

## 12. Priority Ranking

| # | Finding | Severity | Effort |
|---|---|---|---|
| 1 | FastAPI `config` package/module collision — entire Python layer unreachable | **Critical** | Low (rename or re-export) |
| 2 | `digital-products` — 0 of 25 products have a UI | **Critical** | High |
| 3 | `src/routes/` orphaned — 3,350 LOC dead, incl. `dashboard.js` stub with quoting bug | **High** | Medium |
| 4 | `os-workers` orphaned — 4,837 LOC, zero references | **High** | Low (delete or connect) |
| 5 | `backend-clean` empty shell, docs claim it is active | **High** | Low (fix docs) |
| 6 | `VITE_DASHBOARD_API_KEY` + `VITE_BREVO_API_KEY` shipped to browser | **High** | Medium |
| 7 | `.env.local` tracked in git | **High** | Low |
| 8 | Root `supabase/` diverged from canonical (quiz-submit, reputation) | **Medium** | Low |
| 9 | `src/routes/antigravity.js` corrupt (3 bytes) | **Medium** | Low |
| 10 | 10 empty files across dashboard + backend | **Medium** | Low |
| 11 | 8 AI-call paths, 4 email paths, 19 Notion clients | **Medium** | High |
| 12 | `DashboardPage.jsx` 1,526 LOC, 13 tabs | **Medium** | High |
| 13 | `api/index.js` / `hermes/index.ts` 27/28-branch handlers | **Medium** | High |
| 14 | No type definitions in `os-backend/src/types/` (empty) | **Medium** | Medium |
| 15 | Pricing has no single source of truth | **Medium** | Medium |
| 16 | `index.css` brand-rule violations (5) | **Low** | Low |
| 17 | `configMerge.js` + `customer-config.js` white-label system unused | **Low** | Low |
| 18 | `dev/null` 823-LOC build artifact | **Low** | Low |
| 19 | No code splitting; 539 kB dashboard bundle | **Low** | Medium |
| 20 | `dashboard/src/lib/api.js` empty — no API client | **Low** | Medium |
