# OMNIROUTE MIGRATION LOG

## Migration Summary

All obsolete AI gateway endpoints have been replaced with:

- New OmniRoute Endpoint: http://localhost:20128/v1 (local Docker, single gateway)
- Obsolete removed: ai.digitallydefined.agency, Cloudflare tunnel, cloudflared, localhost:4096 (none found), stealth-space-bunny-alpha (none found)

## Changes Made

### Phase 2 - Cleanup

#### 1. digitallydefined-os-backend/src/config/env.js (line 88)
- Before: baseUrl default was https://ai.digitallydefined.agency/api/v1
- After: baseUrl default is http://localhost:20128/v1

#### 2. digitallydefined-os-backend/fastapi/app/config.py (line 33)
- Before: omniroute_base_url default was https://ai.digitallydefined.agency/api/v1
- After: omniroute_base_url default is http://localhost:20128/v1

#### 3. digitallydefined-os-backend/lib/llmClient.js (line 14)
- Before: fallback URL was https://ai.digitallydefined.agency/api/v1
- After: fallback URL is http://localhost:20128/v1

#### 4. digitallydefined-os-backend/fastapi/app/llm.py (lines 39-40)
- Before: Commented latency measurements referencing ai.digitallydefined.agency
- After: Noted local Docker endpoint http://localhost:20128/v1

#### 5. digitallydefined-os-backend/api/index.js (line 841)
- Before: Comment referenced Cloudflare tunnel headers
- After: Comment updated to reference local Docker endpoint

#### 6. omniroute-hermes-mcp-config.yaml (lines 2-7, 15, 30, 49, 59-60)
- Base URL and Chat URL updated to http://localhost:20128/v1
- OMNIROUTE_BASE_URL env comment updated
- base_url comment updated
- MCP SSE URL updated to http://localhost:20128/v1/mcp/sse
- Curl test command updated, tunnel reference removed

#### 7. docs/UNIFIED_DEPLOYMENT_CHECKLIST.md (lines 3, 28)
- Canonical OMNIROUTE_BASE_URL updated to http://localhost:20128/v1
- Cloudflare tunnel reference removed from Hermes MCP checklist item

#### 8. digitallydefined-online-local/README-QUIZ-ROADMAP.md (line 103)
- Updated OMNIROUTE_URL comment to http://localhost:20128/v1

#### 9. digitallydefined-os-backend/fastapi/README.md (line 38)
- Updated to reflect local Docker endpoint http://localhost:20128/v1

#### 10. archive/digitallydefined-backend-clean/src/index.js (line 253)
- Cloudflare tunnel reference replaced with local Docker endpoint

#### 11. archive/digitallydefined-backend-clean/src/config/env.js (lines 253, 414)
- Cloudflare tunnel references removed from comments
- Purpose description updated from (Cloudflare tunnel) to (local Docker)

#### 12. digitallydefined-os-backend/src/config/models.js (lines 33, 35)
- Added deprecated: true flag to auto/best-coding entry
- Added deprecated: true flag to auto/claude-sonnet entry

## Endpoints Removed

| Pattern | Count Removed |
|---|---|
| ai.digitallydefined.agency | 14 |
| Cloudflare tunnel | 9 |
| cloudflared | 0 |
| localhost:4096 | 0 |
| stealth-space-bunny-alpha | 0 |
| auto/best-coding | deprecated (kept with flag) |
| auto/claude-sonnet | deprecated (kept with flag) |

## Deprecated Model Entries

| Model ID | Status | Action |
|---|---|---|
| auto/best-coding | deprecated | Flagged deprecated: true in registry |
| auto/claude-sonnet | deprecated | Flagged deprecated: true in registry |

## Endpoints Added

| Pattern | Count Added |
|---|---|
| http://localhost:20128/v1 | 14 (one per replaced reference) |

## Verification
All ai.digitallydefined.agency and Cloudflare tunnel references removed from the workspace.
OmniRoute now running locally in Docker at http://localhost:20128/v1.

## Next Phase
- Phase 3: Discover OmniRoute models, combos, providers via API
- Phase 4: Cost-optimized routing tiers
- Phase 5: Create hermes-free, hermes-credit, hermes-paid, hermes-coding combos
