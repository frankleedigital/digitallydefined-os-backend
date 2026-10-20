# AI_DEVELOPER_OPTIMIZATION.md

**Generated:** 2026-10-19
**Companion to:** `CODEBASE_AUDIT.md`, `MODULARIZATION_PLAN.md`
**Audience:** Future AI agents (and human developers) working in this codebase.

---

## 0. The Problem in One Paragraph

An AI agent asked to *"fix the dashboard's Notion sync"* in this codebase has to choose between **three different `dashboard` action handlers**, **two different `NotionTab` components**, **four different Notion clients**, and **two different `src/` trees** — and at least one of those choices is guaranteed to be wrong. The codebase is not hostile to AI; it is *ambiguous*. Every ambiguity below is a place where an agent will silently pick the wrong file.

---

## 1. Why AI Agents Struggle Here

### 1.1 The `src/` vs `api/` trap (highest impact)

```
os-backend/
├── api/index.js        ← LIVE. Vercel. 1,627 LOC. 27 action branches.
└── src/                ← ORPHANED. 3,350 LOC of routes/services/agents/schemas.
    ├── index.js        ← mounts api/index.js, so src/routes/ NEVER runs
    └── routes/
        ├── dispatch.js ← 307 LOC catch-all. ZERO importers.
        └── dashboard.js← returns a STUB for the canonical `dashboard` action.
```

**What an agent sees:** two trees, both named like source code, both containing `routes/`, `services/`, `agents/`.

**What is true:** only `api/index.js` executes. `src/` is dead.

**Failure mode:** an agent greps for `handleDashboard`, finds `src/routes/dashboard.js` first (alphabetically and conceptually), and edits a function that never runs. The agent reports success. The bug persists.

**Evidence:**
```
grep -rn "routes/dispatch\|handleDispatch"  →  1 hit: a comment in api/index.js:76
grep -rn "routes/index"                     →  0 hits
src/index.js:36-37                          →  import handler from '../api/index.js'
                                              app.use((req,res) => handler(req,res))
```

### 1.2 The `NotionTab` duplicate

```
dashboard/src/pages/NotionTab.jsx       ← 303 LOC. REAL. Imported by DashboardPage.jsx:38
dashboard/src/pages/tabs/NotionTab.jsx ← 0 bytes. EMPTY.
```

**Failure mode:** an agent asked to "add a field to the Notion tab" may edit the empty file. The build still succeeds (the empty file is not imported). The change does nothing.

### 1.3 The `config` package/module collision

```
fastapi/app/config.py     ← defines `settings = get_settings()`
fastapi/app/config/       ← PACKAGE. __init__.py. No `settings`.
```

**Failure mode:** an agent reads `config/__init__.py`'s docstring — *"Backward-compatible: existing code that does `from .config import settings` still works via re-export"* — and concludes the import is fine. It is not. The entire FastAPI layer is unreachable.

**Verified:**
```
FASTAPI IMPORT FAIL: ImportError cannot import name 'settings' from 'app.config'
app.config resolved to: ...\fastapi\app\config\__init__.py
```

### 1.4 The `backend-clean` documentation trap

`os-backend/README.md`:
> *"This project is no longer the place to add new backend features. New work goes in `digitallydefined-backend-clean/`, which is the active, deployed backend."*

`digitallydefined-backend-clean/` contains: `.env` and `LEGACY_INVENTORY.md`. **No code.**

**Failure mode:** an agent following the docs writes new backend code into an empty directory. The dashboard git history shows the reversal — commit `5fe21b14`: *"fix: point all backend API URLs at digitallydefined-os-backend (backend-clean + api.digitallydefined.agency are dead)"* — but the docs were never updated.

### 1.5 The `action-registry.ts` "single source of truth" claim

`api/index.js:92`:
```js
// NOTE: Keep these lists in sync with supabase/functions/_shared/action-registry.ts
// (single source of truth). Duplicated here because this file is plain Node/Vercel JS
// and cannot import Deno TS modules.
```

`action-registry.ts` contains 42 strings including `agent.`, `fastapi.`, and `routes` — which are **prefixes**, not actions. The two lists are not 1:1.

**Failure mode:** an agent adds an action to `action-registry.ts`, believes it is registered, and does not add it to `api/index.js`. The action 404s.

### 1.6 Empty files that look like modules

| File | Size | Agent failure mode |
|---|---|---|
| `dashboard/src/lib/api.js` | 0 | `import { getDashboardData } from '../lib/api'` → `undefined` |
| `dashboard/src/components/ErrorBoundary.jsx` | 0 | Wrapping a route in a boundary that does nothing |
| `dashboard/src/components/TabNav.jsx` | 0 | Importing a nav component that renders nothing |
| `dashboard/src/lib/hooks/useIntegrations.js` | 0 | Calling a hook that returns `undefined` |
| `dashboard/src/lib/hooks/useSync.js` | 0 | Same |
| `os-backend/src/services/facebook.js` | 0 | Calling `fetchFacebookGroup()` → `TypeError` |
| `os-backend/src/services/sheets.js` | 0 | Same |
| `os-backend/src/routes/antigravity.js` | **3 bytes** (`@\r\n`) | `node --check` → `SyntaxError` |

### 1.7 The `dev/null` artifact

`dashboard/dev/null` — 823 LOC of minified Vite output, committed as a file named `null`.

**Failure mode:** an agent grepping for a symbol finds it in `dev/null`, edits it, and the change is overwritten on the next build.

### 1.8 Naming that does not describe behavior

| Name | What it actually is |
|---|---|
| `src/routes/_original-index-backup.js` | A frozen copy of `api/index.js`. The `_original-` prefix reads like "the original, authoritative version." It is a backup. |
| `src/routes/dispatch.js` | A catch-all dispatcher. Sounds like the entry point. It has zero importers. |
| `digitallydefined-backend-clean` | An empty shell. Sounds like the clean, active backend. |
| `digitallydefined-os-workers` | A Cloudflare Worker service. Sounds like a build tool. |
| `lib/notion-client.mjs` vs `lib/notion-client.js` | **Different implementations** of the same functions, not ESM/CJS variants. |
| `agents/` vs `src/agents/` | Two different agent registries with different agent sets. |
| `ai/` vs `src/services/aiRouter.js` vs `lib/llmClient.js` | Three AI-call paths. |

### 1.9 Duplicated business logic with no ownership marker

| Function | Definitions | Which is live? |
|---|---|---|
| `fetchBrevoStats` | 5 | `api/index.js` (inline) |
| `safeNumber` | 5 | `src/utils/formatters.js` (orphaned) |
| `fetchGoogleAnalytics` | 3 | `dashboard/src/lib/integrations/google-analytics.js` |
| `getAgent` | 3 | `src/agents/index.js` (orphaned) |
| `verifyLicense` | 2 | `dashboard/src/lib/premium.js` |
| `sendEmail` | 2 | `_shared/email-publish.ts` (SendGrid — dead) |
| `fetchNotionSnapshot` | 2 | `api/index.js` |
| `normalizeProperties` | 2 | `dashboard/src/utils/notionMapper.js` |
| `fetchSocialStats` | 2 | `dashboard/src/lib/integrations/social.js` |

**No file carries a `@live`, `@canonical`, or `@deprecated` marker.** An agent cannot tell which definition executes.

### 1.10 Excessive component responsibilities

`DashboardPage.jsx` — **1,526 LOC**:
- 13 tab components (3 imported, 10 inline)
- 20 `useState` hooks
- 101 inline style objects
- 3 fetch calls
- 1 `renderTab()` with a 9-branch `if` chain
- 0 `useCallback`

An agent asked to "add a tab" must edit a 1,526-LOC file and understand 20 pieces of shared state. An agent asked to "fix a style" must choose among 101 inline objects with no naming convention.

`api/index.js` — **1,627 LOC**:
- 1 function (`handler`) with 27 `action ===` branches
- Each branch inlines auth, fetch, error handling, and response shape
- No handler registry (the `ROUTES` map in `src/routes/index.js` is orphaned)

`hermes/index.ts` — **1,709 LOC**:
- 28 `action ===` branches
- 13 direct `fetch` calls
- 4 `TODO`/`FIXME` markers

---

## 2. Recommendations

### 2.1 Folder Restructuring

**Rule: the folder name must answer "does this run?"**

```
os-backend/
├── api/                    ← LIVE entry. Rename to `web/` or keep, but add a README.
├── src/                    ← ORPHANED. Either delete or move to `legacy/src/`.
├── lib/                    ← Mixed. Split into `lib/live/` and `lib/legacy/`.
├── agents/                 ← ORPHANED. Move to `legacy/agents/`.
├── ai/                     ← ORPHANED. Move to `legacy/ai/`.
├── fastapi/                ← BROKEN. Fix the config collision, then keep.
├── supabase/               ← LIVE edge functions. Keep.
├── schemas/                ← ORPHANED. Move to `legacy/schemas/`.
├── prompts/                ← ORPHANED. Move to `legacy/prompts/`.
├── roadmaps/               ← ORPHANED. Move to `legacy/roadmaps/`.
├── tools/                  ← ORPHANED. Move to `legacy/tools/`.
├── data/                   ← ORPHANED. Move to `legacy/data/`.
├── scripts/                ← Mixed. Split into `scripts/live/` and `scripts/legacy/`.
└── docs/                   ← Keep, but correct the false claims.
```

**Add a `LIVE.md` at the repository root:**
```markdown
# LIVE.md — what actually runs

| Path | Runs? | Entry |
|---|---|---|
| `api/index.js` | ✅ YES | Vercel serverless |
| `supabase/functions/` | ✅ YES | Deno Deploy |
| `fastapi/` | ❌ NO | broken import |
| `src/` | ❌ NO | orphaned |
| `agents/` | ❌ NO | orphaned |
| `ai/` | ❌ NO | orphaned |
```

### 2.2 Feature-Based Architecture

See `MODULARIZATION_PLAN.md` §1 for the target tree. The rule for AI agents:

> **`modules/<feature>/` owns the business logic. `services/<integration>/` owns the external call. `packages/` owns the contract.**

An agent looking for "how does the quiz score answers?" goes to `modules/quiz/`. An agent looking for "how do we call Notion?" goes to `services/notion/`. No ambiguity.

### 2.3 Service Extraction

Extract the five services in `MODULARIZATION_PLAN.md` §3. Each gets:

```
services/<name>/
├── index.ts          ← the only public surface
├── types.ts          ← the contract
└── README.md         ← one paragraph: what this service does, what it wraps
```

**Critical:** after extraction, **delete or deprecate-mark every other implementation.** The current state — 19 Notion clients, 8 AI paths, 4 email providers — is the root cause of agent confusion.

### 2.4 API Abstraction

**Create `dashboard/src/lib/api.js`** (currently 0 bytes) as the single API client:

```ts
// dashboard/src/lib/api.js
import { getSupabaseEdgeUrl, getSupabaseEdgeHeaders } from './supabase-edge';

export async function api(action, payload = {}) {
  const res = await fetch(getSupabaseEdgeUrl(), {
    method: 'POST',
    headers: getSupabaseEdgeHeaders(),
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Request failed: ${res.status}`);
  return res.json();
}

export const getDashboard = (ctx) => api('dashboard', ctx);
export const getIntelligence = (answers, userId) => api('intelligence', { answers, userId });
export const verifyLicense = (key, email) => api('license.verify', { licenseKey: key, email });
// ... one export per action
```

**Then:** every page imports from `../lib/api`. No page hand-rolls `fetch`.

**On the backend:** replace the 27-branch `if` chain in `api/index.js` with a handler registry:

```js
// api/handlers/index.js
export { handleDashboard } from './dashboard.js';
export { handleChat } from './chat.js';
// ...

// api/index.js
import { HANDLERS } from './handlers/index.js';
const handler = HANDLERS[action];
if (!handler) return res.status(404).json({ error: `Unknown action: ${action}` });
return handler(req, res);
```

The orphaned `src/routes/index.js` `ROUTES` map is the right shape — it just needs to be the live one.

### 2.5 Centralized Typing

`os-backend/src/types/` is **empty**. `os-workers/src/types.ts` (226 LOC) is the only typed contract and belongs to an orphaned project.

**Create `packages/types/`** with:
- One type per action: `DashboardAction`, `ChatAction`, `IntelligenceAction`, ...
- One type per action payload and response
- One type per service contract
- One type per module input/output

**Then:** every handler is typed. An agent can read the type to learn the contract without reading the implementation.

### 2.6 Shared Interfaces

| Interface | Current state | Target |
|---|---|---|
| `EmailProvider` | 4 implementations, no interface | `services/email/types.ts` |
| `AiService` | 8 implementations, no interface | `services/ai/types.ts` |
| `NotionService` | 19 implementations, no interface | `services/notion/types.ts` |
| `LicensingService` | 2 implementations, no interface | `services/licensing/types.ts` |
| `ProductBody` | `product.renderBody(context)` — undocumented | `modules/product-library/types.ts` |
| `IntegrationConfig` | `dashboard/src/lib/integrations/config.js` | `packages/types/integration.ts` |

### 2.7 Deprecation Markers

Add a machine-readable marker to every file:

```js
// @status: live | orphaned | deprecated | broken
// @entry: api/index.js
// @canonical: yes
```

Then an agent can grep `@status: orphaned` and know not to edit it. This is the single cheapest change with the highest agent-safety payoff.

### 2.8 Fix the Specific Traps

| Trap | Fix |
|---|---|
| `fastapi/app/config` collision | Rename `config.py` → `config_settings.py`, or add `settings` to `config/__init__.py` |
| `src/routes/dashboard.js` quoting bug | Delete the file (orphaned) or fix the quotes and mark it deprecated |
| `src/routes/antigravity.js` (3 bytes) | Delete or restore from `lib/antigravity.js` |
| `NotionTab` duplicate | Delete `pages/tabs/NotionTab.jsx` (empty) |
| `dev/null` | Delete |
| 10 empty files | Delete |
| `backend-clean` docs | Correct `README.md` and `DEPRECATED.md` |
| `action-registry.ts` claim | Either make it the real registry or remove the "single source of truth" comment |
| Root `supabase/` divergence | Reconcile `quiz-submit` and `reputation`, then retire the directory |

---

## 3. The Agent Safety Checklist

Before an AI agent edits any file in this codebase, it should verify:

1. **Is this file live?** Check `LIVE.md`. If it says orphaned, stop.
2. **Is this the canonical implementation?** Grep for the function name. If there are multiple definitions, find the one with `@canonical: yes`.
3. **Is this file empty or corrupt?** `wc -c` before editing. Files under 10 bytes are suspect.
4. **Is this a build artifact?** Check for `dev/`, `dist/`, `output/`, `node_modules/`.
5. **Does the docs claim this runs?** Cross-check against `LIVE.md`. `README.md` and `DEPRECATED.md` are currently wrong about `backend-clean`.
6. **Is this the package or the module?** In `fastapi/app/`, `config` resolves to the package, not `config.py`.

---

## 4. Priority Ranking for Agent Safety

| # | Change | Agent-safety impact | Effort |
|---|---|---|---|
| 1 | Create `LIVE.md` | **Critical** — answers "does this run?" | Low |
| 2 | Fix `fastapi/app/config` collision | **Critical** — unblocks the whole Python layer | Low |
| 3 | Add `@status` markers to every file | **High** — machine-readable liveness | Medium |
| 4 | Resolve the `src/` orphan (delete or `legacy/`) | **High** — removes the biggest trap | Medium |
| 5 | Delete 10 empty files + `dev/null` | **High** — removes silent no-op edits | Low |
| 6 | Delete `pages/tabs/NotionTab.jsx` | **High** — removes the duplicate | Low |
| 7 | Correct `README.md` / `DEPRECATED.md` | **High** — removes the docs trap | Low |
| 8 | Create `dashboard/src/lib/api.js` | **Medium** — one API surface | Medium |
| 9 | Extract `services/notion`, `services/email`, `services/ai` | **Medium** — removes duplication | High |
| 10 | Create `packages/types/` | **Medium** — typed contracts | Medium |
| 11 | Handler registry in `api/index.js` | **Medium** — kills the 27-branch chain | High |
| 12 | Reconcile root `supabase/` | **Low** — removes deploy ambiguity | Low |
