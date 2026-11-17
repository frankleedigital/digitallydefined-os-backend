
# OMNIROUTE MIGRATION AUDIT

> **HISTORICAL RECORD — RETIRED INFRASTRUCTURE.** This document is an audit
> snapshot. The `ai.digitallydefined.agency`, Cloudflare tunnel, `cloudflared`,
> `api.omniroute.ai`, `ai.digitallydefined.online` and Linode
> `45.79.180.236` references below are **retired/dead infrastructure** kept
> for audit trail only. The current source of truth is
> `docs/OMNIROUTE_LOCAL_ONLY_ARCHITECTURE.md` — OmniRoute is **local only**
> at `http://localhost:20128/v1`; production uses direct Gemini.


## Scope
Full audit of all obsolete AI gateway endpoints across the DigitallyDefined workspace.

## New Source of Truth
- **OmniRoute Endpoint:** http://localhost:20128/v1 (local Docker, single gateway)
- **All clients** MUST use this endpoint exclusively.
- **Obsolete:** laptop-ai-gateway, ai.digitallydefined.agency, localhost:4096, Cloudflare tunnel, cloudflared.

## Audit Summary

| Obsolete Pattern | Files | Count | Recommended Replacement |
|---|---|---|---|
| i.digitallydefined.agency | 14 files | 14 | http://localhost:20128/v1 |
| cloudflare tunnel | 9 files | 9 | Removed (Cloudflare tunnels deprecated) |
| uto/best-coding | 6 files | 6 | uto/cheap or uto/best-fast (cost-optimized) |
| localhost:4096 | 0 files | 0 | N/A |
| cloudflared | 0 files | 0 | N/A |
| stealth-space-bunny-alpha | 0 files | 0 | N/A |


## Detailed File-by-File Audit


### 1. omniroute-hermes-mcp-config.yaml
- **Line 6:** https://ai.digitallydefined.agency/api/v1 (Base URL)
- **Line 7:** https://ai.digitallydefined.agency/api/v1/chat/completions (Chat)
- **Line 15:** # OMNIROUTE_BASE_URL=https://ai.digitallydefined.agency/api/v1 (comment)
- **Line 30:** # base_url: https://ai.digitallydefined.agency/api/v1 (comment)
- **Line 49:** # url: https://ai.digitallydefined.agency/api/mcp/sse (comment)
- **Line 60:** # curl -X POST https://ai.digitallydefined.agency/api/v1/chat/completions (comment)

**Recommended replacement:**
- Base URL: http://localhost:20128/v1 (remove /chat/completions suffix as OmniRoute is the gateway)
- All other references to the same URL in this file should also be updated.


### 2. digitallydefined-os-backend/src/config/env.js
- **Line 88:** aseUrl: (process.env.OMNIROUTE_BASE_URL || 'https://ai.digitallydefined.agency/api/v1') (default value)
- **Line 253-255:** // OmniRoute gateway extras (Cloudflare tunnel — not frontend exposed)
- **Line 414:** alue: () => env.omniroute.baseUrl, purpose: 'OmniRoute gateway base URL (Cloudflare tunnel)'

**Recommended replacement:**
- Default baseUrl: http://localhost:20128/v1 (remove Cloudflare tunnel comment)
- Update purpose description to reflect local Docker.


### 3. digitallydefined-os-backend/fastapi/README.md
- **Line 38:** connects to the OmniRoute gateway via Cloudflare tunnel (old URL)

**Recommended replacement:**
- Update to local Docker: http://localhost:20128/v1.



### 4. digitallydefined-online-local/README-QUIZ-ROADMAP.md
- **Line 103:** OMNIROUTE_URL # https://ai.digitallydefined.agency/api/v1 (or tunnel URL)

**Recommended replacement:**
- Update to http://localhost:20128/v1.


### 5. digitallydefined-os-backend/fastapi/app/llm.py
- **Line 39-41:** Commented gateway latency measurements referencing ai.digitallydefined.agency

**Recommended replacement:**
- Remove obsolete latency comments; note local Docker metrics instead.



### 4. digitallydefined-online-local/README-QUIZ-ROADMAP.md
- **Line 103:** OMNIROUTE_URL # https://ai.digitallydefined.agency/api/v1 (or tunnel URL)

**Recommended replacement:**
- Update to http://localhost:20128/v1.


### 5. digitallydefined-os-backend/fastapi/app/llm.py
- **Line 39-41:** Commented gateway latency measurements referencing ai.digitallydefined.agency

**Recommended replacement:**
- Remove obsolete latency comments; note local Docker metrics instead.



### 4. digitallydefined-online-local/README-QUIZ-ROADMAP.md
- **Line 103:** OMNIROUTE_URL # https://ai.digitallydefined.agency/api/v1 (or tunnel URL)

**Recommended replacement:**
- Update to http://localhost:20128/v1.


### 5. digitallydefined-os-backend/fastapi/app/llm.py
- **Line 39-41:** Commented gateway latency measurements referencing ai.digitallydefined.agency

**Recommended replacement:**
- Remove obsolete latency comments; note local Docker metrics instead.



### 4. digitallydefined-online-local/README-QUIZ-ROADMAP.md
- **Line 103:** OMNIROUTE_URL # https://ai.digitallydefined.agency/api/v1 (or tunnel URL)

**Recommended replacement:**
- Update to http://localhost:20128/v1.


### 5. digitallydefined-os-backend/fastapi/app/llm.py
- **Line 39-41:** Commented gateway latency measurements referencing ai.digitallydefined.agency

**Recommended replacement:**
- Remove obsolete latency comments; note local Docker metrics instead.


### 8. archive/digitallydefined-backend-clean/src/index.js
- **Line 253:** omniroute: PRIMARY AI provider via Cloudflare tunnel (old URL)

**Recommended replacement:**
- Remove Cloudflare tunnel reference.
- Update to local Docker: http://localhost:20128/v1


### 9. archive/digitallydefined-backend-clean/src/config/env.js
- **Line 253-255:** OmniRoute gateway extras (Cloudflare tunnel)
- **Line 414:** Purpose: OmniRoute gateway base URL (Cloudflare tunnel)

**Recommended replacement:**
- Remove Cloudflare tunnel reference.
- Update purpose to local Docker.


### 10. docs/UNIFIED_DEPLOYMENT_CHECKLIST.md
- **Line 3:** OMNIROUTE_BASE_URL=https://ai.digitallydefined.agency/api/v1 (canonical)
- **Line 28:** Hermes MCP: provider base_url fixed (was localhost → OmniRoute gateway via Cloudflare tunnel)

**Recommended replacement:**
- Update to http://localhost:20128/v1.
- Remove Cloudflare tunnel reference.


### 11. digitallydefined-os-backend/api/index.js
- **Line 841:** (runGeminiAgent): OmniRoute first, then direct-Gemini across a model fallback list, with the browser-like headers the Cloudflare tunnel needs.

**Recommended replacement:**
- Remove Cloudflare tunnel reference.
- Update to local Docker.


### 12. digitallydefined-os-backend/lib/llmClient.js
- **Line 14:** return String(raw || process.env.OMNIROUTE_BASE_URL || 'https://ai.digitallydefined.agency/api/v1')

**Recommended replacement:**
- Default: http://localhost:20128/v1


### 13. omniroute-hermes-mcp-config.yaml (additional references)
- **Line 2:** OmniRoute -> Hermes wiring (via Cloudflare tunnel)
- **Line 15:** OMNIROUTE_API_KEY=&lt;REDACTED — revoked key, see .env for current value&gt; (note: old key format)
- **Line 30:** base_url: https://ai.digitallydefined.agency/api/v1 (comment)
- **Line 47-49:** omniroute: { type: sse, url: https://ai.digitallydefined.agency/api/mcp/sse }
- **Line 58-62:** TEST the tunnel before debugging Hermes

**Recommended replacement:**
- Remove all Cloudflare tunnel references.
- Update to local Docker endpoint.
- Remove old API key reference.

