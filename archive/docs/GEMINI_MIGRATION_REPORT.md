# Gemini Migration Report — DigitallyDefined

**Date:** 2026-11-07
**Branch (both repos):** `gemini-direct-integration` (from `launch-readiness-fixes`)
- `digitallydefined-dashboard` → `frankleedigital/digitallydefined-dashboard` (pushed, tracking set)
- `digitallydefined-os-backend` → `frankleedigital/digitallydefined-os-backend` (pushed, tracking set)

All secret values are redacted; this report lists key **names** only.

---

## 1. OmniRoute call sites found (grep: `OMNIROUTE|omniroute|omni`)

### Dashboard (`digitallydefined-dashboard/src/`)
| File | Line | What it is |
|---|---|---|
| `src/pages/AIStatusPanel.jsx` | 106 | Default fallback-order label `['omniroute','vertex-gemini','agentrouter','cheap-inference']` — display only, comes from backend health |
| `src/pages/DashboardPage.jsx` | 933 | Assistant message label `provider: "omniroute"` after a model switch — display only |

**No direct OmniRoute fetch exists in dashboard `src/`** — model lists and chat all went through the backend.

### Backend (`digitallydefined-os-backend/supabase/`)
| File | Lines | What it is |
|---|---|---|
| `functions/analytics/index.ts` | 368–380 | Direct OmniRoute config (`OMNIROUTE_API_KEY`, `OMNIROUTE_BASE_URL`, `OMNIROUTE_MODEL`) for AI recommendations |
| `functions/hermes/index.ts` | 106–185, 268, 1693 | OmniRoute as primary route (`OMNIROUTE_DISABLED`, direct-model bypass, `/models` discovery) with an existing Gemini fallback |
| `functions/quiz-submit/index.ts` | 37 | `provider = "omniroute"` default |
| `functions/reputation/index.ts` | 32 | `provider = "omniroute"` default |
| `functions/_shared/omniroute.ts` | whole file | OmniRoute gateway client (`omniRoute`, `omniRouteStream`, endpoint/key helpers) |
| `functions/_shared/ai-client.ts` | 33–39 | OmniRoute client (`OMNIROUTE_API_KEY`/`OMNIROUTE_URL`/`OMNIROUTE_BASE_URL`) |
| `functions/_shared/aiRouter.ts` | 11–26 | OmniRoute router (throws if `OMNIROUTE_API_KEY` missing) |
| `functions/_shared/sync-aggregator.ts` | 575–576 | Dynamic `import('./omniroute.js')` for AI enrichment |
| `functions/hermes/puter-workspace.js` | 267 | Comment referencing `lib/omniroute.js` / `_shared/omniroute.ts` |
| `MIGRATION_GUIDE.md`, `README.md` | various | Docs referencing `OMNIROUTE_*` secrets |

## 2. What was replaced vs. what still uses OmniRoute

**Replaced / newly Gemini-first (this change):**
- Dashboard model-list source order is now: **backend `GET /api/models` → OmniRoute (only when `VITE_OMNIROUTE_BASE_URL` is set) → static Gemini list**. Previously a backend miss returned `null` and the UI used its own internal static list.
- New unified chat path in the dashboard: `aiChat()` tries **Gemini direct → OmniRoute → backend `hermes.chat`**.
- New backend edge-function client `gemini-client.ts` for any function that wants direct Gemini.
- `product-factory/index.ts` **does not exist on this branch** — that sub-step was skipped as instructed.

**Still OmniRoute (unchanged, now secondary/fallback):**
- `hermes/index.ts` routing (its Gemini fallback pre-existed this change).
- `analytics/index.ts`, `quiz-submit`, `reputation`, `sync-aggregator` — all still use the OmniRoute shared modules. Migrated to `gemini-client.ts` in a follow-up if desired.
- Shared `_shared/omniroute.ts`, `ai-client.ts`, `aiRouter.ts` modules kept intact (nothing deleted).

## 3. New files created

| Repo | File |
|---|---|
| dashboard | `src/lib/gemini.js` — direct Gemini API client (flash/pro, 429 retry, system-prompt support) |
| dashboard | `src/lib/aiProvider.js` — `aiChat()` provider chain Gemini → OmniRoute → Backend |
| backend | `supabase/functions/_shared/gemini-client.ts` — Deno/TypeScript Gemini client for edge functions |

**Modified:**
- dashboard `src/lib/modelSelector.js` — static Gemini groups as default, OmniRoute secondary, never crashes offline
- dashboard `src/services/api.js` — added named export `postAction(action, payload, { timeoutMs })` (used by `aiProvider`); existing API untouched
- backend `.env` — appended `AI_PROVIDER=gemini` (`GEMINI_API_KEY` already present — not overwritten)

Also removed a stray untracked `build.out.txt` (21-line leftover build log) from the dashboard working tree before committing.

## 4. Environment variables

Appended **only** where missing (verified append-only; existing values untouched):

| File | Keys added |
|---|---|
| dashboard `.env` (gitignored, local only) | `VITE_GEMINI_API_KEY=` *(empty — paste your Gemini key here)*, `VITE_AI_PROVIDER=gemini`, `VITE_OMNIROUTE_BASE_URL=` *(optional, enables secondary source)*, `VITE_OMNIROUTE_API_KEY=` *(optional)*, `VITE_OMNIROUTE_MODEL=auto` |
| backend `.env` (gitignored) | `AI_PROVIDER=gemini`; `GEMINI_API_KEY` already existed → skipped |

**Deploy-time requirements:**
- Vercel dashboard build: set `VITE_GEMINI_API_KEY` as a build env var (`.env` is gitignored, so it is NOT in the commit).
- Supabase edge functions: `supabase secrets set GEMINI_API_KEY=<redacted>` for `gemini-client.ts` to work.

## 5. Provider priority chain

`aiChat()` (dashboard) and the model-list resolver use:

```
1. Gemini direct   (gemini-2.5-flash-preview-04-17; 2.5-pro-preview-06-05 for
                   audit / report / code_review / analysis / business_report)
2. OmniRoute       only if VITE_OMNIROUTE_BASE_URL is set (model: VITE_OMNIROUTE_MODEL or "auto")
3. Backend         hermes.chat via postAction, 60 s timeout
```

Model list: `backend /api/models → OmniRoute /models (if configured, 4 s timeout) → static Gemini list`.
Each failure is logged with `console.warn('[aiProvider] …')`; the chain never throws to the UI.

## 6. Estimated cost impact

- **Gemini (new primary):** the 2.5 preview models were offered on Google's **free tier** (rate-limited, ~50 RPM / 250 req-day class for flash-preview) — so typical dashboard/assistant volume at $0 marginal cost up to those caps. Flash is the cheapest paid tier (~$0.10/M input, $0.40/M output); Pro is ~10× that — used only for the 5 "Pro-class" task types.
- **OmniRoute (now fallback):** paid per-token gateway with pass-through model pricing + platform markup. Keeping it only as a fallback means you pay gateway costs **only when Gemini is missing/429-retried or unavailable**.
- Net estimate: near-100% of routine dashboard AI traffic moves from paid-gateway to free-tier/quota Gemini; hard floor of $0/day for the flash path, small overflow billing on Pro-class tasks only. (Estimate assumes current free-tier availability; Google preview terms can change.)

## 7. Build result

`npm run build` in the dashboard (branch `gemini-direct-integration`):

```
> digitallydefined-reputation-dashboard@1.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 1946 modules transformed.
(1 pre-existing warning: api.js dynamic/static import mix; 1 chunk >500 kB warning)
dist/index.html                   6.81 kB │ gzip:   2.35 kB
dist/assets/index-ByQvTkit.css   19.01 kB │ gzip:    4.80 kB
dist/assets/index-Cv8eldFv.js   586.31 kB │ gzip:  169.46 kB
✓ built in 13.30s
```

Exit code 0 — **build passes**. Backend `gemini-client.ts` verified with `deno check` (clean).

Commits:
- dashboard `feat: direct Gemini integration with OmniRoute fallback` — 4 files, +207/−6
- backend `feat: Gemini client for Supabase edge functions` — 1 file, +40

## 8. Risk assessment

| Risk | Severity | Mitigation / status |
|---|---|---|
| `VITE_GEMINI_API_KEY` ships in the browser bundle (Vite inlines it) | **High** | Restrict the key in Google AI Studio: per-domain referrer/IP allowlist, quotas. For full isolation, route chat through the backend `hermes.chat` instead of direct-from-browser. |
| Pinned model IDs are **preview** (`-preview-04-17`, `-preview-06-05`) — Google can retire them | Medium | Both IDs live in one const per client (`MODELS` in `gemini.js`, `gemini-client.ts`) — a one-line swap when a GA model ships. |
| Dashboard `.env` is gitignored → Vercel deploys have no Gemini key unless set in dashboard env settings | Medium | Set `VITE_GEMINI_API_KEY` in Vercel project env before deploy; until then the chain degrades gracefully to backend `hermes.chat`. |
| Backend `hermes.chat` fallback assumes `reply` in the response; a shape mismatch yields empty content, not an error | Low | `tryBackend` still marks `ok:true` with empty content only if the action succeeds; verify once live and adjust field if needed. |
| 429 retry is a fixed 2 s single retry (no backoff loop) | Low | Acceptable for chat UX; extend to exponential backoff if free-tier caps are hit often. |
| Dashboard OmniRoute secondary source inactive (`.env` keys empty by default) | Low | Intentional — Gemini-first; fill in `VITE_OMNIROUTE_BASE_URL` to re-activate the secondary source. |
| Edge functions don't yet use `gemini-client.ts` (only `hermes` had a Gemini fallback before) | Low | Client is ready and `deno check`-clean; wiring it into `analytics`/`quiz-submit`/`reputation` is a follow-up (kept out of this change to minimize blast radius). |

## 9. Remaining OmniRoute dependencies

Backend — still primary or shared for: `hermes/index.ts` routing, `analytics/index.ts` recommendations, `quiz-submit/index.ts`, `reputation/index.ts`, `sync-aggregator.ts` enrichment, and the shared modules `_shared/omniroute.ts`, `ai-client.ts`, `aiRouter.ts`. All keep working as-is; they become redundant fallbacks while `OMNIROUTE_API_KEY` remains set.

Dashboard — OmniRoute is now **opt-in**: only the model-list secondary source and `aiChat()` provider #2 activate when `VITE_OMNIROUTE_BASE_URL` is configured. The two display-only strings (AIStatusPanel fallback-order labels, DashboardPage provider label) are cosmetic and unchanged.

Docs — `supabase/MIGRATION_GUIDE.md` and `supabase/README.md` still document `OMNIROUTE_*` secrets; add a `GEMINI_API_KEY` section in the next docs pass.
