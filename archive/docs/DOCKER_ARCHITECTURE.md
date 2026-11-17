# Docker Architecture — DigitallyDefined

**Source of truth: live Docker state** (`docker ps`, `docker inspect`, `docker logs`) audited 2026-10-24 on this Windows host, cross-referenced against `digitallydefined-os-backend/docker-compose.yml`, `fastapi/Dockerfile`, and the backend env/config sources. No source files were modified.

---

## 1. Container Inventory (live `docker ps -a`)

| Container | Image | Purpose | Port | Health Status | Dependencies |
|---|---|---|---|---|---|
| `omniroute` | `diegosouzapw/omniroute:3.8.51` | AI gateway — single OpenAI-compatible endpoint routing to ~49 upstream provider connections (Copilot, Kiro, Antigravity, Cline, AI Horde, Gemini, grok-cli, agy, combo auto/* routes). Backs all DD LLM traffic locally. | `127.0.0.1:20128 → 20128/tcp` (localhost-only) | **Up, `healthy`** (built-in healthcheck `node healthcheck.mjs`, interval 30s, timeout 5s, start period 15s, 3 retries). Up since 2026-10-23T19:14:38Z, 0 restarts. | Named Docker volume `omniroute-recovery-20261011-152432` → `/app/data` (SQLite state). Env: `REQUIRE_API_KEY`, `PORT=20128`, `DATA_DIR`. **Not defined in any repo compose file** — run standalone (`docker run`). Restart policy: `unless-stopped`. |
| `welcome-to-docker` | `docker/welcome-to-docker:latest` | Docker Desktop onboarding demo container. No production role. | `0.0.0.0:8088 → 80/tcp` | **Exited (255)** — stopped for 5 days. Restart policy: `none`. | None. |

**Not running:** `os-backend` (the only service in `digitallydefined-os-backend/docker-compose.yml`) has **zero running containers**. It is a defined-but-dormant compose service: `build: .` (the FastAPI `Dockerfile`: python:3.11-slim → uvicorn `app.main:app` on port 8000; compose publishes 3000:3000 — a port mismatch worth noting), `env_file: .env`, `restart: unless-stopped`, R2 env vars. The FastAPI app currently runs outside Docker (or not at all); Docker's only live workload is OmniRoute.

---

## 2. OmniRoute Forensics

### 2.1 Is OmniRoute running?

**Yes — verified live, healthy, and authenticated.**

| Question | Verified answer |
|---|---|
| Running? | `docker ps`: `Up 20 hours (healthy)`; `docker inspect`: health=`healthy`, started 2026-10-23T19:14:38Z, 0 restarts |
| Where? | Container `omniroute` on this host (bridge network), port **127.0.0.1:20128** only — deliberately loopback-bound |
| Endpoint | `http://127.0.0.1:20128/v1` — OpenAI-compatible (`/v1/chat/completions`, `/v1/models`); dashboard on `/dashboard` (307 redirect); MCP SSE at `/v1/mcp/sse` per `omniroute-hermes-mcp-config.yaml` |
| Auth | `REQUIRE_API_KEY` env set. No key → **401 AUTH_002** "Authentication required" (confirms the service is alive and enforcing auth). With the key from `digitallydefined-os-backend/.env` (`sk-954…e29`) → **200 OK**, `/v1/models` returns **6,941 models** (45 `auto/*` combo routes). Auth works. |
| Linode 45.79.180.236:20128? | **Unreachable** (curl timeout). Matches `.env` comments: "LOCAL ONLY. There is no public OmniRoute endpoint and no Cloudflare tunnel." |
| Public `https://ai.digitallydefined.online/v1` (from `.env.local`)? | **Unreachable** (curl exit 000). The `.env.local` key (`sk-952…7ed`) also returns **401** against the local gateway — it belongs to a different/defunct deployment. `.env` is the canonical local config. |

### 2.2 Startup flow (from `docker logs omniroute`)

1. **Entrypoint:** `/app/check-permissions.sh` → **Cmd:** `node dev/run-standalone.mjs` (standalone mode, no compose orchestration).
2. **Bootstrap warnings** (non-fatal): Antigravity OAuth + Qoder OAuth client secrets not configured → those providers disabled; `INITIAL_PASSWORD` unset → dashboard admin password defaults to `CHANGEME` (security finding).
3. **Web server:** Next.js 16.3.5 binds `0.0.0.0:20128` inside the container (host maps loopback-only).
4. **Database:** better-sqlite3 opens `/app/data/storage.sqlite` (DATA_DIR=/app/data — the persistent volume). WAL passive checkpoints run continuously in logs.
5. **Startup subsystems:** global fetch proxy patch → quota fetchers → proxy logger (200 logs from SQLite) → graceful shutdown handlers → spend batch writer → guardrail registry → builtin skill handlers → quota cache refresh.

### 2.3 Service registration & provider health checks

- **Schedulers started at boot:** `ProviderLimitsSync` (70 min interval), `QuotaAutoPing`, `ModelSync` (6 h interval, +45 min phase offset), batch processor polling.
- **ModelSync cycle** (model discovery): syncs every registered provider connection — observed log: `[ModelSync] Cycle complete: 27/29 synced in 85645ms`. Two failures observed: `main (41ba974d): sync returned 502` and `cloudcode-one` rejected with **429 budget_exceeded** (key budget $0.00). Codex/Claude profiles skip `aihorde` (disabled).
- **CredentialHealth:** periodic sweep — `[CredentialHealth] Testing 48/49 connections...` — one connection excluded per cycle.
- **HealthCheck loop:** runs inside the container and refreshes expiring OAuth tokens before they die: Copilot tokens (every cycle, ~5/refresh burst), Kiro social token, Google token (Antigravity), Cline token. All observed refreshes succeeded. `ProviderLimitsSync Cycle complete: 10/10 synced in 13052ms`.

### 2.4 Routing layer & model discovery (what `/v1/models` exposes)

- **6,941 model IDs** served under one Bearer token. Structure:
  - **`auto/*` combo routes (45):** `auto/cheap`, `auto/best-fast`, `auto/best-chat`, `auto/best-coding`, `auto/reasoning`, `auto/vision`, vendor pins (`auto/gemini`, `auto/qwen`, `auto/kimi`, `auto/gpt`, …), tiered variants (`auto/coding:fast|cheap|free|pro|reliable`). Combo = OmniRoute picks/fails over across providers internally; context up to 2 M tokens.
  - **Provider-prefixed direct models:** `agy/*` (Antigravity: Gemini 3.8 Flash tiers, Claude Opus 4.6 thinking), `grok-cli/grok-4.7`, `gc/grok-4.7` (responses API), `static-best-free` (pinned snapshot), thousands of catalog entries.
- **Fallback policy is gateway-side.** `.env.omniroute.example` states there are intentionally no `OMNIROUTE_FALLBACK_MODEL_*` vars on the backend — provider fallback lives inside OmniRoute. The FastAPI layer still keeps its own model-level fallback chain (below).

### 2.5 How the backend consumes OmniRoute (`digitallydefined-os-backend`)

- **Config** (`fastapi/app/config.py`): `omniroute_base_url` default `http://localhost:20128/v1`; `omniroute_model = "auto/cheap"` (deliberately not bare `auto`, which the gateway rejects with 401 "No active credentials"); fallback chain `["auto/cheap", "auto/best-fast", "auto/chat", "auto/best-chat"]` ordered by measured latency.
- **Env** (`.env` canonical): `OMNIROUTE_BASE_URL=http://localhost:20128/v1`, `OMNIROUTE_API_KEY=sk-954…`, `OMNIROUTE_MODEL=auto`, `OMNIROUTE_DISABLED=false`; production (Vercel) sets `OMNIROUTE_DISABLED=true` and uses direct Gemini since localhost isn't reachable there. `.env.local` overrides point at the dead public URL — latent misconfiguration if `.env.local` wins precedence.
- **Startup probe** (`fastapi/app/deps.py`): lifespan `check_dependencies()` GETs the base URL; `<500` = reachable. Missing key → non-fatal warning, LLM endpoints degrade to deterministic output.
- **Client** (`fastapi/app/llm.py`, `OmniRouteClient`): pooled `httpx.AsyncClient`, retries with exponential backoff on 429/5xx/network (3 retries, 750 ms → 3 s cap), handles both JSON and SSE responses (this gateway streams even when `stream:false`), 300 s/256-entry response cache, ordered model failover, `call_json` validates parsed JSON objects.
- **Consumers:** niche, asset-plan, product generator, rank-rent, wealth, roadmap services — all degrade gracefully to deterministic output when OmniRoute is absent.
- **Hermes wiring:** `omniroute-hermes-mcp-config.yaml` documents the same canonical endpoint and registers OmniRoute as an MCP SSE server (`/v1/mcp/sse`).

### 2.6 Findings / risks

1. **`INITIAL_PASSWORD` unset** → OmniRoute dashboard admin password is the default `CHANGEME` (logged at boot). Anyone with localhost access can reach `/dashboard`.
2. **`.env.local` points at a dead deployment** (`ai.digitallydefined.online`, unreachable; its key 401s locally). `.env` is the working config — keep precedence explicit.
3. **Two provider connections unhealthy:** `cloudcode-one` (budget exceeded) and one sync returning 502 — 27/29 model syncs succeed.
4. **Single point of truth is the volume** `omniroute-recovery-20261011-152432`; losing it loses all provider credentials/connections. Back it up.
5. **Compose drift:** `os-backend` compose maps 3000:3000 while the Dockerfile EXPOSEs/`uvicorn`s 8000 — the service has never been started in Docker, so the mismatch is latent, not active.