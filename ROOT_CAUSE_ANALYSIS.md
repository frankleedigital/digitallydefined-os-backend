# ROOT_CAUSE_ANALYSIS.md — Why OmniRoute Shows "DOWN"

## The Error

Dashboard `AI Infrastructure Status` panel shows:
```
omniroute: DOWN
Error: OMNIROUTE_API_KEY or OMNIROUTE_BASE_URL not configured
```

## The Trace (verified end-to-end)

```
Dashboard UI (AIStatusPanel.jsx)
  │ postAction('hermes.status') via api-client.js
  │ base URL: https://digitallydefined-os-backend.vercel.app
  ▼
Vercel: api/index.js (action = 'hermes.status')
  │ imports src/services/providerHealth.js
  │ calls checkAllProviders()
  ▼
providerHealth.js:18-21 — checkOmniRoute()
  │ reads env.omniroute.apiKey ← process.env.OMNIROUTE_API_KEY
  │ reads env.omniroute.baseUrl ← process.env.OMNIROUTE_BASE_URL
  │
  │ On Vercel: BOTH ARE EMPTY
  │ (push-vercel-env.mjs deliberately excludes them)
  │
  └→ returns { status: 'unhealthy', error: 'OMNIROUTE_API_KEY or OMNIROUTE_BASE_URL not configured' }
```

## Why the env vars are missing on Vercel (AND WHY THAT'S CORRECT)

1. **OmniRoute runs in local Docker** at `127.0.0.1:20128`. Vercel serverless functions cannot reach localhost.
2. `scripts/push-vercel-env.mjs:69` **intentionally skips** OMNIROUTE vars when pushing env to Vercel.
3. The `.env` file itself documents: *"for production (Vercel), where OmniRoute (localhost) is not reachable."*
4. Even if the vars were set, Vercel would get connection refused trying to reach `http://localhost:20128`.

**This is the designed architecture.** OmniRoute is local-only. Vercel uses Vertex/Gemini directly.

## The Real Problem

The dashboard status panel **reports the truth** — OmniRoute IS down from Vercel's perspective. But the panel's design is misleading because:

1. It implies OmniRoute SHOULD be running and something is broken.
2. It shows "CRITICAL" / "DOWN" for a provider that is intentionally unavailable from the production deployment.
3. Users see 3/4 providers as "DOWN" and one "Healthy" — looks like a failing system, not a correctly configured one.

## Secondary Issues Found

| Issue | Impact |
|---|---|
| `.env.local` overrides `OMNIROUTE_BASE_URL` to dead `ai.digitallydefined.online` | If `.env.local` takes precedence locally, FastAPI can't reach OmniRoute either |
| Three different API keys across env files (hashes don't match) | Key rotation risk — only `os-backend/.env` key works against local container |
| OmniRoute dashboard password = `CHANGEME` (default) | Security: anyone on localhost can access admin |
| `cloudcode-one` provider: budget_exceeded ($0) | 1 of 49 connections non-functional |
| Stale "Cloudflare tunnel" comments on ACTIVE env vars | Misleading for future developers |
