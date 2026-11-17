# OmniRoute — Local-Only Architecture (Source of Truth)

**Status:** Active
**Last verified:** 2026-10-21
**Scope:** DigitallyDefinedClean workspace — all repos, Hermes Desktop profiles, Vercel deployments.

---

## 1. Architecture

OmniRoute is a **local-only AI gateway**. It runs as a Docker container on the
developer machine and is published on the host loopback interface only. There is
**no public OmniRoute endpoint**, **no Cloudflare Tunnel**, and **no remote
OmniRoute host**.

```
┌──────────────────────── LOCAL MACHINE (Windows) ─────────────────────────┐
│                                                                            │
│  Hermes Desktop                                                            │
│      │  http://localhost:20128/v1                                          │
│      ▼                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ Docker: omniroute  (diegosouzapw/omniroute:3.8.51)          │          │
│  │   listens  0.0.0.0:20128  (inside container)                 │          │
│  │   published 127.0.0.1:20128 -> 20128/tcp  (host loopback)    │          │
│  │   → 62 provider connections, 48/49 credential checks pass     │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                                                            │
│  os-backend (local)   ──► http://localhost:20128/v1  (OmniRoute primary)  │
│  fastapi (local)      ──► http://localhost:20128/v1                        │
│  Supabase edge fns    ──► http://localhost:20128/v1 (default only)         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────── VERCEL (public) ─────────────────────────────┐
│                                                                            │
│  dashboard.digitallydefined.agency  ──► digitallydefined-os-backend.vercel.app/api
│                                                     │                      │
│                                                     ▼                      │
│                                          Direct Gemini                      │
│                            https://generativelanguage.googleapis.com/v1beta │
│                                                                            │
│  OMNIROUTE_DISABLED=true  → OmniRoute is never contacted from Vercel.      │
│  localhost:20128 is unreachable from serverless — this is expected.        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Canonical endpoint

| Constant | Value |
|---|---|
| OmniRoute base URL | `http://localhost:20128/v1` |
| OmniRoute chat completions | `http://localhost:20128/v1/chat/completions` |
| OmniRoute MCP (SSE) | `http://localhost:20128/api/mcp/sse` |
| OmniRoute dashboard | `http://localhost:20128/dashboard` |
| Production AI provider | Direct Gemini (OpenAI-compatible endpoint) |
| Gemini chat endpoint | `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` |

Rules:

1. Any component that runs **on the developer machine** uses
   `http://localhost:20128/v1`.
2. Any component that runs **on Vercel** uses direct Gemini and sets
   `OMNIROUTE_DISABLED=true`.
3. No component may reference a public OmniRoute hostname. There isn't one.

---

## 3. Retired infrastructure

The following are **dead**. They must never be called, and no new code may
reference them.

| Retired item | Status | Notes |
|---|---|---|
| `45.79.180.236:20128` (Linode OmniRoute) | **DEAD** | Host decommissioned. All TCP ports refuse. `curl` → exit 7. |
| `https://ai.digitallydefined.online/v1` | **DEAD** | DNS points to a domain-parking page (parity.domains). TLS broken (curl exit 35). |
| `https://ai.digitallydefined.agency/v1` | **DEAD** | No DNS record. Was the Cloudflare Tunnel hostname. |
| `https://api.omniroute.ai/v1` | **DEAD** | No DNS. Was the OmniRoute cloud default. |
| Cloudflare Tunnel (`cloudflared`, tunnel `38d16536-8c5b-4753-adf9-b25243b3b303`) | **RETIRED** | Process not running. Tunnel state `status: error`. Do not restart. |
| `mcp.digitallydefined.agency` / `.online` | **DEAD** | Tunnel hostnames, no DNS. |
| `agents.digitallydefined.agency` / `.online` | **DEAD** | Tunnel hostnames, no DNS. |
| `localhost:4096` (labelled "opencode") | **MISLABELLED** | Port 4096 is owned by `kilo.exe`, not an opencode server. |

---

## 4. Credentials

Keys are **not** rotated by this remediation. This section documents current
usage only.

| Variable | Value location | Verified result | Consumed by |
|---|---|---|---|
| `OMNIROUTE_API_KEY` (`sk-952d12af…`) | `os-backend/.env` | local Docker gateway key | `os-backend` local runs, `fastapi` |
| `HERMES_CUSTOM_OMNIROUTE_API_KEY` (`sk-954ba6f1…`) | `C:\Users\frank\AppData\Local\hermes\.env` | **200 OK** against `http://localhost:20128/v1/models` (2.7 MB catalog) | Hermes Desktop `providers.omniroute` |
| `OMNIROUTE_API_KEY` (`a2125f8d…`) in Hermes `.env` | `C:\Users\frank\AppData\Local\hermes\.env` | **401 Unauthorized** — stale | unused by Hermes `providers.omniroute` |
| `GEMINI_API_KEY` | `os-backend/.env` | live | production (Vercel) AI path |
| `OMNIROUTE_DISABLED` | `os-backend/.env` (false locally), pushed `true` to Vercel | — | skips OmniRoute in serverless |

> The Hermes `.env` variable `OMNIROUTE_API_KEY` is **not** the key Hermes uses
> for OmniRoute. Hermes reads `providers.omniroute.key_env`, which is
> `HERMES_CUSTOM_OMNIROUTE_API_KEY`. Standardising these two names is a
> **manual action** item; no key was rotated or created here.

---

## 5. Provider order

| Deployment | Order |
|---|---|
| Local (Hermes Desktop, os-backend local, fastapi) | OmniRoute (`http://localhost:20128/v1`) → direct Gemini fallback |
| Production (Vercel `api/index.js`, `api/business-partner`) | Direct Gemini only (`OMNIROUTE_DISABLED=true`) |
| Production (`ai/gateway/router.ts`) | OmniRoute → Gemini, with OmniRoute skipped when disabled or unconfigured |

---

## 6. Verification commands

```powershell
# OmniRoute alive + key accepted
curl.exe -s -o NUL -w "%{http_code}" http://localhost:20128/v1/models -H "Authorization: Bearer sk-954ba6f1ba020b50-9b9b34-239bc6fe"
# expect: 200

# Container / publish state
docker ps --filter "name=omniroute" --format "{{.Names}} {{.Status}} {{.Ports}}"
# expect: omniroute Up ... 127.0.0.1:20128->20128/tcp

# Production AI path (must report a gemini provider, never omniroute)
curl.exe -s -X POST "https://digitallydefined-os-backend.vercel.app/api" `
  -H "Content-Type: application/json" -H "x-api-key: DigitallyDefined-OS-2026" `
  -d '{"action":"chat","message":"Reply with the single word OK"}'
# expect: "provider":"gemini-direct..."
```

---

## 7. Known issue (pre-existing, not introduced here)

On the Vercel path, `OMNIROUTE_MODEL=auto` is also used as the *Gemini* model
name, so the Gemini chain wastes two doomed attempts (`auto`, then
`gemini-3.5-flash-lite`) before reaching `gemini-3.1-flash-lite`. This is a
latency optimisation only; the path is functional. Tracked as a manual item.

---

## 8. Related documents

- `digitallydefined-os-backend/docs/configuration-registry.md` — env var registry
- `digitallydefined-os-backend/docs/INTEGRATION_INVENTORY.md` — integration inventory
- `digitallyDefined_CREDENTIAL_REGISTRY.md` — credential registry
- `OMNIROUTE_MIGRATION_AUDIT.md` — historical audit (retired infrastructure)
- `OMNIROUTE_MIGRATION_LOG.md` — historical migration log (retired infrastructure)
- `OMNIROUTE_HERMES_FIX.md` — Hermes fixes + remaining production steps
