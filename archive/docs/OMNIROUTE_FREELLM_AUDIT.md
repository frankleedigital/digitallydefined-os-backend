# OmniRoute Dependency Audit — FreeLLMAPI Replacement Analysis

**Date:** 2026-11-07
**Scope:** `digitallydefined-os-backend` + `digitallydefined-dashboard` (branch: `launch-readiness-fixes` / `gemini-direct-integration`)
**Question:** Treating OmniRoute as optional infrastructure, which features depend on it, and which can run on FreeLLMAPI instead?

---

## 0. What OmniRoute Actually Is (and What It Actually Does Here)

OmniRoute is a **local Docker gateway** at `http://localhost:20128/v1` that speaks the OpenAI chat-completions protocol. In the DigitallyDefined stack it provides exactly three capabilities:

| Capability | Where used | Replacable by FreeLLMAPI? |
|---|---|---|
| 1. Chat completions (OpenAI-compatible) | All 3 client wrappers | **YES** — FreeLLMAPI exposes the same protocol |
| 2. `auto` model routing (gateway picks upstream model/provider) | Default model selection (`OMNIROUTE_MODEL=auto`) | **PARTIAL** — a free API has no router; you must name an explicit model (e.g. Gemini Flash). Low risk. |
| 3. SSE streaming chat | `omniRouteStream()` in `hermes` function (dashboard chat) | **PARTIAL** — falls back to non-streaming Gemini; UX degrades slightly but works |

**Critical discovery — OmniRoute is ALREADY optional in this codebase.** Every AI client already ships a direct Gemini fallback and a kill switch:

- `supabase/functions/_shared/omniroute.ts` line 131: `OMNIROUTE_DISABLED=true` skips OmniRoute entirely
- `supabase/functions/hermes/index.ts` lines 120, 144, 165: same flag, routes straight to Gemini
- `api/index.js` lines 722-724: same flag on the Vercel Node side
- `lib/llmClient.js`: Gemini fallback already implemented
- `GEMINI_API_KEY` is already present in both `.env` files

**Fastest path to a stable revenue dashboard: set `OMNIROUTE_DISABLED=true` in Vercel + Supabase env vars. Every AI feature then runs on Gemini (covered by your Google credits). OmniRoute becomes truly optional — the Docker container can be off and nothing breaks.**

---

## 1. Every OmniRoute Dependency, Mapped

### 1.1 AI client layers (the 3 wrappers everything calls)

| File | Runtime | OmniRoute role | Gemini fallback? |
|---|---|---|---|
| `supabase/functions/_shared/omniroute.ts` | Deno edge functions | Primary call, incl. streaming | YES (`geminiFallback()`) |
| `supabase/functions/_shared/aiRouter.ts` | Deno edge functions | `run()` thin wrapper | NO — throws if key missing |
| `supabase/functions/_shared/ai-client.ts` | Deno edge functions | Used by `quiz-submit`, `reputation` | verify (see §2) |
| `lib/llmClient.js` | Vercel Node | All 10 agents in `agents/` | YES |

### 1.2 Revenue-path features

| Feature | Call site | OmniRoute dependence | FreeLLMAPI verdict |
|---|---|---|---|
| **Quiz scoring** (lead qualification — top of funnel) | `supabase/functions/quiz-submit/index.ts` → `ai-client.ts` | Hard dep on an LLM call | **FreeLLMAPI OK** — one chat completion per quiz; rate limits fine for launch volume |
| **Product factory** (idea → Gumroad product) | `supabase/functions/product-factory/index.ts` | Migrated to direct Gemini on `gemini-direct-integration` branch | Already independent of OmniRoute |
| **Hermes AI chat** (dashboard assistant) | `supabase/functions/hermes/index.ts` | Primary, but Gemini fallback + `OMNIROUTE_DISABLED` | **FreeLLMAPI OK** — or just set the flag; Gemini free tier covers it |

### 1.3 Automation features (batch jobs — most tolerant of free-tier limits)

| Feature | Call site | FreeLLMAPI verdict |
|---|---|---|
| Analytics digest | `supabase/functions/analytics/index.ts` | **FreeLLMAPI OK** — once-daily, low volume |
| Follow-up messages | `supabase/functions/followup/index.ts` | **FreeLLMAPI OK** — low volume, per-lead |
| Optimization loops | `supabase/functions/optimization-loop*` | **FreeLLMAPI OK** — weekly, low volume |
| Post publisher | `supabase/functions/post-publisher` | **FreeLLMAPI OK** |
| Reputation report | `supabase/functions/reputation/index.ts` | **FreeLLMAPI OK** |
| Notion sync aggregator | `supabase/functions/_shared/sync-aggregator.ts` line 575 | **FreeLLMAPI OK** — dynamic import, isolated |

### 1.4 Dashboard frontend

| File | Finding |
|---|---|
| `src/lib/aiProvider.js` | **Already Gemini-first** (new `gemini-direct-integration` work) — OmniRoute is the 2nd fallback only if `VITE_OMNIROUTE_BASE_URL` is set |
| `src/lib/modelSelector.js` | Static Gemini model list now defaults; OmniRoute model fetch is conditional + crash-safe |
| `AIStatusPanel.jsx` | Displays provider status; cosmetic only |
| `AssistantPage.jsx`, `DashboardPage.jsx` | Chat UIs — they call the backend, never OmniRoute directly |

**Frontend conclusion: after the Gemini integration, the dashboard has ZERO hard OmniRoute dependencies.**

### 1.5 Vercel Node backend

| File | Finding |
|---|---|
| `api/index.js` | Supports `OMNIROUTE_DISABLED=true` (lines 722-724) — AI goes straight to Gemini |
| `agents/*.js` (10 agents) | All call `lib/llmClient.js`, which already has Gemini fallback |
| `src/services/aiRouter.js`, `providerHealth.js`, `ai.js` | Provider abstraction — already multi-provider capable |

---

## 2. Classification (the 4 buckets you asked for)

### 🟥 CRITICAL FOR LAUNCH — do not touch these providers until they work
| Item | Why |
|---|---|
| `quiz-submit` scoring | Revenue funnel entry — a broken LLM call = no scored leads |
| `hermes` chat | Core dashboard value prop |
| `product-factory` | Revenue machine (Idea → Gumroad) |

**These are already Gemini-backed** (free credits, via fallback or direct). Launch-critical = **stable free-tier LLM access**, not OmniRoute.

### 🟩 CAN USE FREE LLMAPI INSTEAD (set base URL + key, keep everything else)
1. `analytics` digest
2. `followup` messages
3. `optimization-loop` + `optimization-loop-weekly`
4. `post-publisher`
5. `reputation`
6. `sync-aggregator`
7. `quiz-submit` (if Gemini free-tier limits are ever hit — FreeLLMAPI as second free source)
8. All 10 Vercel agents via `lib/llmClient.js` (one env-var change)

**Integration note:** FreeLLMAPI speaks OpenAI-compatible chat completions, so each of these only needs `OMNIROUTE_BASE_URL`/`OMNIROUTE_API_KEY` pointed at it (or a new `FREELLMAPI_BASE_URL`/`_KEY` if you want cleaner naming — one constant per client). Volume at launch (single-digit users) is far below free-tier rate limits.

### 🟦 REQUIRES OMNIRROUTE — NONE
Nothing in the system requires OmniRoute-only capabilities. The only OmniRoute-specific features are `auto` model routing and gateway-side multi-provider failover — both of which are **nice-to-have**, not functional requirements. Explicit `gemini-flash` / `gemini-pro` model selection replaces `auto` at zero risk.

### ⚫ REMOVE ENTIRELY (dead / test-only / dev-time)
| Item | Evidence |
|---|---|
| `scripts/test-omniroute.js`, `test-omniroute-models.mjs`, `test-omniroute-agentops.js` | Local test scripts — hit `localhost:20128` directly, never called in production |
| `scripts/smoke-hermes-mcp.mjs`, `hermes-mcp-server.mjs` | Dev smoke tests, not referenced by any deployment config |
| `src/routes/_original-index-backup.js` | Dead backup file |
| `OMNIROUTE_STARTS`, `OMNIROUTE_WS_BRIDGE_SECRET` env vars | No code references found in active paths |
| `agentops` import in `omniroute.ts` | Already wrapped in try/catch, no-op without key |

---

## 3. Fastest Path to a Stable, Revenue-Generating Dashboard

**Do this in this order (≈ 30 minutes of env-var changes, zero code rewrites):**

1. **Set `OMNIROUTE_DISABLED=true`** in Vercel project env AND as a Supabase secret. Every production AI path instantly becomes Gemini-only (already implemented and tested in the code). The local Docker container becomes irrelevant to production.
2. **Confirm `GEMINI_API_KEY`** is set in both environments (it is, per `.env` audit — but verify the Vercel deploy env has it).
3. **For batch jobs** (analytics, followup, optimization loops, post-publisher, reputation): optionally point their LLM calls at FreeLLMAPI to spread load across two free providers — one env var per call site, nothing else.
4. **Pin model names** in the batch jobs (`gemini-flash` equivalent) so `auto` routing is never needed.
5. **Archive the 5 test scripts + 2 dead env vars** from §2⚫. Do NOT delete `omniroute.ts` or the client layers — they're the fallback chain; keep them, keep them disabled.

**Stability outcome:** production AI = Gemini (your Google credits, always on) + optional FreeLLMAPI for batch jobs. OmniRoute = a dev-machine convenience that can be off 100% of the time. No launch dependency on local Docker state.

---

## 4. Risks & Watchouts

| Risk | Severity | Mitigation |
|---|---|---|
| Free-tier rate limits on Gemini during quiz spike | Medium | FreeLLMAPI as second free provider (bucket 🟩) |
| `ai-client.ts` fallback path not verified in this audit | Low | Test `quiz-submit` with `OMNIROUTE_DISABLED=true` before launch (one curl) |
| FreeLLMAPI service availability (third-party free tier) | Medium | It's batch-only; failures log and retry next run — never blocks revenue |
| `auto` model removal changes output quality slightly | Low | Pin `gemini-flash` for chats, `gemini-pro` for reports — matches the new routing in `aiProvider.js` |
