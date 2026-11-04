# CURRENT_ARCHITECTURE.md — DigitallyDefined (verified 2026-10-24)

> **Trust basis:** running Docker containers, live HTTP probes, source code, env files, build configs.
> All claims verified against real system state — not docs, comments, or READMEs.

## Live System Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USER'S LOCAL MACHINE (Windows 11)                 │
│                                                                     │
│  ┌──────────────────────┐     ┌─────────────────────────────────┐   │
│  │  OmniRoute (Docker)  │     │  Dashboard dev/preview (Vite)   │   │
│  │  127.0.0.1:20128     │     │  localhost:4173 / :5173         │   │
│  │  6,941 models        │     │  React 18 + Tailwind            │   │
│  │  49 provider conns   │     └──────────┬──────────────────────┘   │
│  │  healthy, auth req   │                │                          │
│  └──────────┬───────────┘                │                          │
│             │ ← local only               │ HTTPS (CORS)             │
│             │   (Vercel can't reach)     │                          │
└─────────────┼────────────────────────────┼──────────────────────────┘
              │                            │
              ▼                            ▼
┌─────────────────────────┐  ┌──────────────────────────────────────┐
│  FastAPI (local only)   │  │  Vercel: digitallydefined-os-backend │
│  fastapi/app/main.py    │  │  https://digitallydefined-os-backend │
│  port 8000 (not Docker) │  │            .vercel.app               │
│  Connects OmniRoute via │  │                                      │
│  localhost:20128 (works) │  │  api/index.js → action router        │
│  3-retry, backoff, SSE  │  │  src/services/providerHealth.js      │
└─────────────────────────┘  │                                      │
                             │  CAN'T reach localhost OmniRoute     │
                             │  Uses Vertex Gemini as PRIMARY       │
                             └────────────┬─────────────────────────┘
                                          │
                 ┌────────────────────────┼────────────────────────┐
                 ▼                        ▼                        ▼
         Vertex / Gemini           (OmniRoute)              AgentRouter
         GEMINI_API_KEY ✓         NOT CONFIGURED            NOT CONFIGURED
         gemini-3.5-flash          on Vercel                 ~$400 credits
         HEALTHY                   SHOWS "DOWN"              SHOWS "DOWN"
```

## What's Running

| Component | Where | Status | Verified |
|---|---|---|---|
| OmniRoute 3.8.51 | Docker, localhost:20128, loopback-only | **Healthy**, 6941 models, auth works | `docker ps`, `curl -H Auth /v1/models` → 200 |
| Dashboard | Vercel (`dashboard.digitallydefined.agency`) + local preview :4173 | **Running** | Build clean, browser render OK |
| Backend API | Vercel (`digitallydefined-os-backend.vercel.app`) | **Running** — but limited | curl POST /api → 200, hermes.status works |
| Vertex/Gemini | Google Cloud (direct API key) | **Healthy** | Health check → latency ~5s |
| Supabase Edge Functions | `dijjlppdljpcgyoakdnq.supabase.co` | **Running** (9 deployed functions) | Known from prior sessions |
| FastAPI | Not running (no Docker container, no process) | **Dormant** | compose service defined, zero containers |
| AgentRouter | External, not configured | **Down** | No AGENTROUTER_API_KEY set |
| Cheap Inference | External, not configured | **Down** | No env vars set |

## What's Dead

| Component | Evidence |
|---|---|
| Linode OmniRoute (45.79.180.236) | curl timeout; all ports refuse; env comments confirm retired |
| ai.digitallydefined.online | curl exit 000; DNS may still resolve but nothing answers |
| Cloudflare Tunnel 38d16536-... | Status: error; mcp./agents.digitallydefined.agency: DNS dead |
| backend-clean (Vercel project) | Superseded by os-backend; archive/ folder only |
| digitallydefined-os-workers | Cloudflare Workers; zero references from live code |
| Root supabase/ tree | RETIRED.md + CLI link renamed; canonical = os-backend/supabase/ |

## AI Provider Fallback Chain (on Vercel)

The backend's `providerHealth.js` checks providers in this order:
1. **OmniRoute** → `OMNIROUTE_API_KEY` + `OMNIROUTE_BASE_URL` — **MISSING on Vercel** → returns "not configured"
2. **Vertex/Gemini** → `GEMINI_API_KEY` — **SET on Vercel** → healthy, latency ~5-13s
3. **AgentRouter** → `AGENTROUTER_API_KEY` — **MISSING** → "not configured"
4. **Cheap Inference** → `CHEAPER_INFERENCE_*` — **MISSING** → "not configured"

Result: Vertex/Gemini is the only active provider on Vercel. This is correct and intentional (per `.env` comment: "production skips OmniRoute and goes straight to direct Gemini").

## Key Env Files (source of truth)

| File | Purpose | Status |
|---|---|---|
| `os-backend/.env` | Canonical backend config | ACTIVE — correct localhost OmniRoute + all keys |
| `os-backend/.env.local` | Override — points at dead `ai.digitallydefined.online` | **STALE/DANGEROUS** — if loaded, breaks OmniRoute |
| `os-backend/.env.omniroute.example` | Template | OK |
| `os-backend/scripts/push-vercel-env.mjs` | Deliberately EXCLUDES OmniRoute vars from Vercel | Correct behavior |
| `digitallydefined-backend-clean/.env` | Stub dir, retired keys | DEPRECATED |
| Container `/app/data/server.env` | OmniRoute bootstrap secrets | ACTIVE (container-internal) |
