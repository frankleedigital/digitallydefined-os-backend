# GA Cleanup Plan — G-SQGCJN9WG3 (investigation findings + proposed changes)
**Status: PLAN ONLY — no changes made.** 2026-11-10
Scope: `G-SQGCJN9WG3` / property `532506061` vs the new browser tag `G-GQE8DZ15BL`.

---

## 1. Where G-SQGCJN9WG3 is referenced

### Value occurrences (env files + Vercel)
| Location | Var | State |
|---|---|---|
| `digitallydefined-os-backend/.env` L60–61 | `GA4_MEASUREMENT_ID`, `GA4_PROPERTY_ID` | live backend (local) |
| `digitallydefined-os-backend/.env` L134–135 | `GA_MEASUREMENT_ID`, `GA_PROPERTY_ID` | live backend (local) |
| `digitallydefined-dashboard/.env` L48 | `VITE_GA_MEASUREMENT_ID` | local build only |
| `digitallydefined-backend-clean/.env` L248 | `GA4_*` | **dead duplicate** (no Vercel link) |
| `archive/digitallydefined-backend-clean/.env` L246 | `GA4_*` | **archived** (stale Vercel link) |
| Vercel `digitallydefined-os-backend` (prod) | `GA_MEASUREMENT_ID`, `GA_PROPERTY_ID` (secrets, added today); `GA4_MEASUREMENT_ID`, `GA4_PROPERTY_ID` (configs, 19h) | **active in prod** |
| Vercel `digitallydefined-dashboard` (prod) | `VITE_GA_MEASUREMENT_ID` (60d old) | **inlined into the production bundle** |

### Code that consumes it (env-var names)
| File | Live? | Role |
|---|---|---|
| `os-backend/api/index.js` L810, 2055–2143 | **LIVE** | `fetchGa4Stats` + `integration.googleAnalytics`/`.start` — the Integrations-tab GA card. Reads property/measurement + `GA_SA_KEY_B64` |
| `dashboard/src/lib/integrations/config.js` L5–6 | **LIVE** | UI "configured" state for the GA card |
| `dashboard/src/lib/integrations/google-analytics.js` | **LIVE** | card client (fetches backend payload) |
| `os-backend/src/config/env.js` L255–256 (`GA4_*`) + `src/routes/integrationsDispatch.js` | **DEAD** | Legacy Vercel-functions-era dispatcher. The live API handles all `integration.*` actions directly and the delegated-actions list never includes them → unreachable in prod |
| `digitallydefined-dashboard/.env.example` (old project) | docs only | commented `VITE_GA_INTEGRATION_ENABLED`, `VITE_GA_MEASUREMENT_ID`, `VITE_GA_PROPERTY_ID` |

## 2. Which GA property does it belong to?
`G-SQGCJN9WG3` → GA4 **property `532506061`** (the pair you provided). Its account/property name is not visible to me — confirm in GA Admin → Property settings.
**`G-GQE8DZ15BL`'s property is unverified** — check GA Admin → Data Streams to see whether it's the same property `532506061` or a different one. This answer decides the whole cleanup direction (Section 5).

## 3. Does it track digitallydefined.online? — **NO**
- `digitallydefined.online` **is expired**: it currently serves a Namecheap parking page ("Domain registration has expired", Plausible only, zero GA/GTM).
- The live-site source (`~/Documents/DigitallyDefined/digitallydefined-online-local`) contains **no** gtag/GTM/GA4/UA/Plausible code.
- `digitallydefined.store` origin is down (Cloudflare 522/525) — not verifiable live right now; its source is also clean of GA.
- The only GA4 browser tag running anywhere today: **`G-GQE8DZ15BL` in the dashboard SPA** (verified inlined in the deployed prod bundle).

## 4. Is it active in production?
- **As a browser tag: NO** — G-SQGCJN9WG3 is not in any deployed site.
- **As the Integrations-tab API card: YES (partially)** — Vercel backend has `GA_MEASUREMENT_ID`/`GA_PROPERTY_ID`/`GA_SA_KEY_B64` set and the service-account pipeline is deployed; currently blocked only by "share property 532506061 with the service account".
- Vercel dashboard still inlines the 60-day-old `VITE_GA_MEASUREMENT_ID` into the bundle.

## 5. Can it be safely removed?
**Removing the value breaks nothing browser-side** (it isn't a tag anywhere). Its only consumer is the GA card on the Integrations tab. Two directions:

**Direction A — keep property 532506061 as the dashboard's GA property (if G-GQE8DZ15BL is NOT under it):**
- Nothing is removed. Only action: share property `532506061` with `digitallydefined-ga4-service-a@eminent-clock-509216-e0.iam.gserviceaccount.com` (Read & analyze) → card goes live.
- G-GQE8DZ15BL stays as the SPA's browser tag; card shows 532506061 numbers. Only sensible if 532506061 actually receives site traffic — which it doesn't today.

**Direction B — unify on the property behind G-GQE8DZ15BL (recommended if 532506061 belongs to the dead .online site):**
- Point the GA card at G-GQE8DZ15BL's property: share THAT property with the service account, swap `GA_PROPERTY_ID`/`GA_MEASUREMENT_ID` values in os-backend/.env + Vercel, and `VITE_GA_PROPERTY_ID`/`VITE_GA_MEASUREMENT_ID` in dashboard .env + Vercel → redeploy both.
- Then G-SQGCJN9WG3 can be deleted from every location (it feeds nothing after the swap).

**Safe to remove under BOTH directions:**
- `digitallydefined-backend-clean/.env` + `archive/.../.env` `GA4_*` lines — dead duplicates, zero runtime effect
- empty `GA_API_KEY=` / `GA_SA_KEY=` in os-backend/.env (code reads `GA_SA_KEY_B64` only)
- dead legacy code: `src/routes/integrationsDispatch.js` + the `googleAnalytics` block in `src/config/env.js` (unreachable — see §1)
- stale `.vercel` link inside the archived duplicate

## 6. Legacy DigitallyDefined.online analytics references (complete list)
1. **The domain itself** — expired, parking page. Decision needed: renew `.online` or retire it (redirect to `.store`). This is the root legacy item.
2. `archive/digitallydefined-backend-clean` + `digitallydefined-backend-clean` — duplicate backends with stale `GA4_*` env values and old `integrationsDispatch` code.
3. `src/routes/integrationsDispatch.js` + `src/config/env.js` GA4 block — legacy dispatch code, dead on the live route.
4. Old-project `digitallydefined-dashboard/.env.example` — commented `VITE_GA_INTEGRATION_ENABLED` (flag no longer exists in code) + GA var docs.
5. Vercel dashboard `VITE_GA_MEASUREMENT_ID` (60d) — stale prod env, inlined into current builds.
6. **No Universal Analytics (`UA-`) or GTM container IDs found anywhere in either tree** — the legacy surface is GA4-only.

---

## CLEANUP PLAN (execution order — NOT yet done)

### Phase 1 — zero-risk housekeeping (no decision needed)
1. Delete `GA4_MEASUREMENT_ID`/`GA4_PROPERTY_ID` lines from both `digitallydefined-backend-clean/.env` copies (dead duplicates).
2. Delete empty `GA_API_KEY=` / `GA_SA_KEY=` lines from `digitallydefined-os-backend/.env` (names the code never reads).
3. Delete stale `.vercel` link dir in `archive/digitallydefined-backend-clean`.
4. Commit env-file hygiene. *(No behavior change anywhere.)*

### Phase 2 — decision-gated (needs your answer: which GA property stays?)
- **If Direction B (recommended):** in GA Admin share G-GQE8DZ15BL's property with the service account → update the 4 values (backend `GA_PROPERTY_ID`+`GA_MEASUREMENT_ID` in .env + Vercel; dashboard `VITE_GA_PROPERTY_ID`+`VITE_GA_MEASUREMENT_ID` in .env + Vercel — `VITE_GA4_BROWSER_ID`/G-GQE8DZ15BL unchanged) → redeploy both → verify the card shows live numbers.
- **If Direction A:** share property 532506061 with the service account (one click, already instructed) → card goes live, nothing removed.
- After either: delete any orphaned G-SQGCJN9WG3 values from all §1 locations.

### Phase 3 — legacy code removal (after Phase 2 settles the GA card)
5. Delete `src/routes/integrationsDispatch.js` + the `googleAnalytics` section of `src/config/env.js` (verified unreachable in prod; re-grep before deletion to stay safe).
6. Update old-project `.env.example` docs (drop `VITE_GA_INTEGRATION_ENABLED`).
7. Decide `.online` domain: renew or 301 to `.store`.

**Verification per phase:** backend `node --check` + local harness `integration.googleAnalytics` call; dashboard `npm run build`; `vercel env ls` diff; GA DebugView for the tag; card screenshot for the API path.
