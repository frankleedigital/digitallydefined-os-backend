# OmniRoute ↔ Hermes Agent Fix — Summary

**Date:** 2026-10-19
**Status:** Code fixes applied & verified locally. Production deploy still required.

---

## Root Causes Found (7 distinct issues)

### 1. Dashboard Hermes chat bypassed the backend
`dashboard/src/lib/hermes.js` → `getHermesEndpoint()` returned
`{VITE_SUPABASE_URL}/functions/v1/hermes` (the **Supabase edge function**).
The edge function has **no `hermes.agent` branch** — it answers
`404 Unknown action`. Only the Vercel dispatcher (`api/index.js:1077`) handles
`hermes.agent`.

### 2. The model was never sent with the request
`sendToHermes()` posted `{ action, message, systemPrompt, toolState, page }` —
**no `model` field**. `api/index.js:1121` reads `req.body.model`, but nothing
supplied it. `modelSelector.js` only *persisted* the choice; the chat path
never read it back.

### 3. `businessPartner.js` ignored the model
`aiRouter.generate(null, ...)` — the first argument is the model override, and
it was hardcoded to `null`, so the model always came from the job class
(`JOB_MODELS.reasoning` = `omni/premium-blueminds`). The user's dropdown
selection was silently ignored.

### 4. Vercel listed model actions it never implemented
`api/index.js` ALLOWED_ACTIONS contained `hermes.setActiveModel` /
`hermes.getActiveModel`, but there were **no branches for them** — they fell
through to the `404 Unknown action` tail. `modelSelector.js` step-2 fallback
posted those actions, got 404, and silently degraded to localStorage.

### 5. Stale `OMNIROUTE_API_KEY` — why "models don't work"
- A **User-level environment variable** was set on this machine, holding an
  **old / revoked** OmniRoute key.
- `dotenv.config()` does **not** override existing env vars, so the stale key
  always won over the correct value in `.env`.
- The stale key produced `401 AUTH_002 "Invalid API key"`, and `aiRouter`
  **silently fell back** to OpenRouter (`openai/gpt-4o-mini`) — which is why
  it looked like the models "weren't available".
- **Fixed:** the User env var was updated to the valid key from `.env`
  (see `.env`, never committed).

### 6. Production env pointed at a dead host
Vercel has `OMNIROUTE_BASE_URL=https://ai.digitallydefined.online/v1`.

## Changes Applied

### Backend (`digitallydefined-os-backend/`)

| File | Change |
|------|--------|
| `src/routes/businessPartner.js` | Honors `body.model` — passes it as the `aiRouter.generate()` model override instead of `null` |
| `api/index.js` | Added `business.partner` to ALLOWED_ACTIONS + a branch delegating to `handleBusinessPartner()` (with raw-string body normalization) |
| `api/index.js` | Removed phantom `hermes.setActiveModel` / `hermes.getActiveModel` actions (comment points at the working `/api/set-model`, `/api/active-model`, `/api/models` functions) |
| `src/config/models.js` | Registry rebuilt against the live catalog: 31 entries, all present in the catalog, `verified` flags corrected to real probe results |

### Dashboard (`digitallydefined-dashboard/`)

| File | Change |
|------|--------|
| `src/lib/hermes.js` | `getHermesEndpoint()` → Vercel backend dispatcher (`getSupabaseEdgeUrl()`), not the edge function. `sendToHermes()` attaches the active `model`. `getHermesStatus()` probes the backend instead of a dead relative path. Headers now from `supabase-edge.js` (correct `x-api-key`). |
| `src/lib/modelSelector.js` | Removed the always-404 `hermes.getActiveModel` fallback; added synchronous `getActiveModelId()`; removed unused import; updated header comments |
| `src/pages/DashboardPage.jsx` | Chat now sends `model: getActiveModelId() || ASSISTANT_MODEL`; converted mixed static/dynamic `modelSelector` imports to static (fixes Vite chunking warning) |
| `src/pages/AssistantPage.jsx` | Chat now sends `model: getActiveModelId() || DEFAULT_ASSISTANT_MODEL` |

## Verification (local, against the live gateway)

```
RESULT req=auto/best-chat              => provider=omniroute model=gemini-3.8-flash-tiered
RESULT req=auto/best-reasoning         => provider=omniroute model=deepseek-v3.1:free

## Remaining Production Steps (NOT done — requires your action)

1. **Make the gateway reachable from Vercel.** Options:
   - Start the Cloudflare tunnel (`cloudflared tunnel run`) — `~/.cloudflared/config.yml` maps `ai.digitallydefined.agency` → `http://localhost:20128` — **and** fix the `ai.digitallydefined.agency` DNS record (currently does not resolve).
   - Or set Vercel `OMNIROUTE_BASE_URL` to a working public endpoint for the gateway.
   - Note: `http://localhost:20128` will **never** work from Vercel — it is the Docker container's loopback bind on your machine.

2. **Update the Vercel secret** `OMNIROUTE_API_KEY` to the valid key from the
   backend `.env` (the one currently on Vercel is the old/revoked key).
   Use: `npx vercel env rm OMNIROUTE_API_KEY production` then
   `npx vercel env add OMNIROUTE_API_KEY production` (secret).

3. **Deploy the backend** so the `business.partner` route and the model override ship:
   `npx vercel --prod` in `digitallydefined-os-backend/`.

4. **Deploy the dashboard** so the chat sends `model`:
   `npx vercel --prod` in `digitallydefined-dashboard/`.

5. **Re-verify** after deploy:
   ```
   POST https://digitallydefined-os-backend.vercel.app/api/business-partner
   { "message": "hi", "model": "auto/best-chat" }
   ```
   Expect `provider: "omniroute"` and a model id that is **not** `openai/gpt-4o-mini`.
   If it returns `openai/gpt-4o-mini`, the OmniRoute credential/base URL is still wrong on Vercel.

## Known Non-Blockers (surfaced during testing, pre-existing)

- **Brevo fetch 404** and **Sheets webhook 404** in `businessPartner.js` — the live `BREVO_API_KEY` / `SHEETS_WEBHOOK_URL` point at endpoints returning 404. The handler catches these and falls back to `Live data unavailable.`, so chat still works but the grounding context is empty.
- **Vertex non-Gemini models** (`vertex/claude-*`, `vertex/deepseek-*`, `vertex/qwen-*`) are in the OmniRoute catalog but fail with: *"Vertex partner models require project-scoped credentials; Express API keys support Gemini models only."* Only Vertex **Gemini** models work with the current key — the registry reflects this.
- **Bluesminds (`bm/*`) upstream circuit breaker is open** (503) — those models are listed but do not currently return completions.

RESULT req=vertex/gemini-3.7-flash     => provider=omniroute model=gemini-3.7-flash
RESULT req=agy/gemini-3.8-flash-tiered => provider=omniroute model=gemini-3.8-flash-tiered
```

- Dashboard build: clean (only the pre-existing chunk-size notice)
- Backend: `node --check` passes on all modified files
- Dispatcher routing verified: `business.partner` → 200 (not 404); `hermes.setActiveModel` / `hermes.getActiveModel` → 404 (now intentional)
- All 31 registry models confirmed present in the live 7,113-model catalog

That host resolves (104.219.250.37 / 2.59.170.20) but **TLS fails** and the
Cloudflare tunnel (`cloudflared`) is **not running**, so the public gateway is
unreachable from Vercel. Local `.env` uses `http://localhost:20128/v1`
(OmniRoute in Docker, bound to 127.0.0.1) — correct for local, useless for Vercel.

### 7. Model registry was stale
14 of 31 registry entries no longer existed in the live catalog
(`bm/gpt-4o`, `bm/gpt-4o-mini`, `vertex/gemini-3.8-flash`, `gemini-2.5-pro`,
`free-stack`, `gemini-3.5-flash-lite`, …). The registry has been rebuilt
against the live 7,113-model catalog.
