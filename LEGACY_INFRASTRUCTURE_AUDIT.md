# LEGACY_INFRASTRUCTURE_AUDIT.md — DigitallyDefinedClean

> Generated 2026-10-24. Scope: whole tree, excluding `node_modules`, `.git`, `.venv`, `.venv-1`, `dist`,
> generated artifacts (`models.json`, `omniroute_models.json`, `.tmp-gw.*`, `audit_*.json`, `scratch_storage.sqlite`, `package-lock.json`).
> Classification key: **ACTIVE** = read by live code path · **DEPRECATED** = live code references it but it is retired/local-only by design · **UNUSED** = dead infra, code still imports/reads it but target is gone · **UNKNOWN** = docs/config only, unverifiable from code.

## Summary Counts

| Pattern | Hits |
|---|---|
| `linode`, `ngrok`, `host.docker.internal`, `45.79.180.236` | 7 |
| `cloudflare`, `tunnel` | 132 |
| `127.0.0.1` | 18 |
| `OMNIROUTE_BASE_URL`, `OMNIROUTE_API_KEY` | 222 |
| `provider registry`, `fallback chain`, `provider health` | 11 |
| **TOTAL** | **390** |

## 1. Linode / Dead Remote Infra (`45.79.180.236`, ngrok)

| File:Line | Hit | Classification |
|---|---|---|
| `digitallydefined-backend-clean/.env:202,205` | `# LINODE / LOCAL INTERNAL …` / `# RETIRED: Linode OmniRoute (45.79.180.236) decommissioned - local Docker only` | DEPRECATED — comment-only; no live URL points at Linode |
| `digitallydefined-os-backend/docs/INTEGRATION_INVENTORY.md:289` | "Regenerate the gateway/API token … on the Linode" | UNUSED — stale doc instruction; contradicts local-only architecture |
| `docs/OMNIROUTE_LOCAL_ONLY_ARCHITECTURE.md:79` | `45.79.180.236:20128` (Linode OmniRoute) = **DEAD**, all ports refuse | UNUSED — confirmed dead, doc records it |
| `OMNIROUTE_MIGRATION_AUDIT.md:6-7` | Linode / `45.79.180.236` "retired/dead infrastructure kept" | UNUSED — audit doc |

No `ngrok` hits anywhere. No `host.docker.internal` hits anywhere (good — no Docker-host coupling).

## 2. Cloudflare / Tunnels (132 hits)

**Live, legitimate Cloudflare usage (ACTIVE):**
| File | Evidence |
|---|---|
| `digitallydefined-os-backend/.env:101` | `R2_ENDPOINT=https://f1affbba44899c858011411920a8ef39.r2.cloudflarestorage.com` — R2 storage used by `lib/r2Storage.js` and FastAPI |
| `digitallydefined-os-backend/fastapi/app/config/cloudflare.py` | Reads `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` — both **unset** in every `.env` (verified: zero assignments). Code path exists but unconfigured |
| `digitallydefined-os-workers/*` | Entire project is Cloudflare Workers — but project itself is DEPRECATED/orphaned (see SYSTEM_MAP) |

**Retired tunnel infra (UNUSED — dead, DNS gone):**
| File:Line | Hit | Classification |
|---|---|---|
| `docs/OMNIROUTE_LOCAL_ONLY_ARCHITECTURE.md:81-85` | `ai.digitallydefined.agency/v1` DEAD (no DNS); Cloudflare Tunnel `38d16536-8c5b-4753-adf9-b25243b3b303` RETIRED, status:error; `mcp.`/`agents.digitallydefined.agency/.online` DEAD | UNUSED |
| `digitallydefined-os-backend/src/config/env.js:261,430` | Comments still say "(Cloudflare tunnel)" for OMNIROUTE_BASE_URL | DEPRECATED comment on an ACTIVE var — the var itself is live (`http://localhost:20128/v1`), comment is stale |
| `digitallydefined-os-backend/src/services/aiRouter.js:3`, `archive/.../aiRouter.js:3` | `// PRIMARY: OmniRoute (API gateway - uses your tunnel)` | DEPRECATED comment |
| `digitallydefined-os-backend/api/index.js:787` | "Cloudflare WAF on the OmniRoute tunnel" comment | DEPRECATED comment |
| `digitallydefined-os-backend/.env.omniroute.example:10`, `fastapi/.env.example:17`, `MIGRATION.md:27`, `.env:68` | "no Cloudflare tunnel" assertions | DEPRECATED (correct documentation of retirement) |
| `OMNIROUTE_MIGRATION_AUDIT.md` / `OMNIROUTE_MIGRATION_LOG.md` (~40 hits) | Historical tunnel-removal changelog | UNUSED — docs |

## 3. `127.0.0.1` / Loopback (18 hits)

| File:Line | Hit | Classification |
|---|---|---|
| `digitallydefined-os-backend/.env:72` + `.env.example:12` | `OMNIROUTE_BASE_URL=http://localhost:20128/v1` (loopback-published Docker) | ACTIVE by design — local-only gateway; `api/index.js:721` confirms OmniRoute is skipped in serverless/Vercel |
| `digitallydefined-os-backend/server.ts:19` | `http://127.0.0.1:54321/functions/v1/hermes` | ACTIVE — local Supabase stack |
| `digitallydefined-backend-clean/.env:42,204` | `OMNIROUTE_WS_URL=ws://127.0.0.1:20128`, `MAIN_BASE_URL=http://127.0.0.1:20128` | UNUSED — stub dir has no code consuming them |
| `archive/digitallydefined-backend-clean/.env:41,203` + `server.log:5` | Same loopback OmniRoute URLs | UNUSED — archived |
| `supabase/config.toml:99,159,163,195` | `api_url`/`site_url` on 127.0.0.1 | DEPRECATED — retired root supabase tree |
| `OMNIROUTE_HERMES_FIX.md:126` | "bound to 127.0.0.1 — useless for Vercel" | Doc; correct |

## 4. OMNIROUTE_BASE_URL / OMNIROUTE_API_KEY (222 hits)

- **ACTIVE (live code reads):** `digitallydefined-os-backend/` — `api/index.js` (7 hits), `lib/hermesMcp.js` (12), `lib/llmClient.js` (7), `ai/gateway/client.ts`, `src/config/env.js`, `src/services/aiRouter.js:330`, `src/services/providerHealth.js:21`, `fastapi/app/llm.py`, `fastapi/app/deps.py`, `fastapi/app/config/environment.py`, `supabase/functions/{hermes,analytics,_shared/*}` — all default to `http://localhost:20128/v1`.
- **ACTIVE but LOCAL-ONLY limitation:** `scripts/push-vercel-env.mjs:69` deliberately excludes OMNIROUTE vars from Vercel — Vercel deploys use direct Gemini; OmniRoute works only on local Docker runs.
- **UNUSED (archived):** all `archive/digitallydefined-backend-clean/` hits (~42) still point at dead `https://ai.digitallydefined.online/v1` and `https://api.omniroute.ai/v1` defaults.
- **DEPRECATED stub:** `digitallydefined-backend-clean/.env:36-37` (sk-954…ce29, localhost URL) — no consuming code in that dir.
- **Stale doc defaults:** `docs/hermes-mcp-archive/hermes/modules/omniroute.py:19` defaults to `https://omniroute.ai` (dead); `docs/archive/OMNIROUTE_INTEGRATION.md` same. UNUSED.
- **Credential hygiene risk:** `OMNIROUTE_API_KEY` is duplicated across `os-backend/.env`, `.env.local`, `digitallydefined-backend-clean/.env`, archive `.env`, and (per `digitallyDefined_CREDENTIAL_REGISTRY.md`) `~/.hermes/.env` — rotation requires multi-file update.

## 5. Provider Registry / Fallback Chain / Provider Health (11 hits)

| File:Line | Hit | Classification |
|---|---|---|
| `digitallydefined-os-backend/src/services/providerHealth.js:73` | Runs all provider health checks in parallel | ACTIVE |
| `digitallydefined-os-backend/api/index.js:740,1267` | Gemini model fallback chain; Hermes provider-health endpoint | ACTIVE |
| `digitallydefined-dashboard/src/pages/AIStatusPanel.jsx:2,96,100` | UI consuming provider health / fallback chain | ACTIVE |
| `digitallydefined-os-backend/fastapi/app/config.py:39`, `fastapi/.env.example:25` | Ordered fallback chain config | ACTIVE |
| `digitallydefined-os-backend/fastapi/app/routers/products_api.py:3` | Firestore → in-memory fallback chain | ACTIVE |
| `docs/archive/PUTER_INTEGRATION_COMPLETE.md:50`, `HERMES_MODEL_ALIASES.md:79` | Fallback chain mentions | UNKNOWN — docs only |

No "provider registry" (as a literal term) hits in code.

## Key Conclusions

1. **Linode (`45.79.180.236`) is fully decommissioned** — zero live code references; only comments/docs remain. Safe to strip.
2. **No ngrok, no host.docker.internal** anywhere — clean.
3. **Cloudflare tunnel infra is dead but ~50 stale comments/docs remain**, notably the misleading "(Cloudflare tunnel)" comment attached to the ACTIVE `OMNIROUTE_BASE_URL` in `os-backend/src/config/env.js:430`.
4. **Real Cloudflare dependency = R2 storage only** (`r2Storage.js`, live bucket). Workers project is orphaned; Cloudflare API credentials are unset everywhere.
5. **Biggest legacy surface is OmniRoute env-var sprawl: 222 hits across 4 copies** (live backend, stub dir, archive, docs), three different base URLs (`localhost:20128` live / `ai.digitallydefined.online` dead / `api.omniroute.ai` dead).
6. `supabase/` root tree is correctly deploy-disabled (RETIRED.md + renamed CLI link) — keep or delete, but never deploy from it.

</content>