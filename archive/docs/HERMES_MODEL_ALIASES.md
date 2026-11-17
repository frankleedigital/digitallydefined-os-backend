# HERMES MODEL ALIASES

## Source: OmniRoute at http://localhost:20128/v1
API Key: <REDACTED — live value lives only in digitallydefined-os-backend/.env, never commit it>
Total models discovered: 5561 across 45 providers

## Combo Alias Support Status
The OmniRoute instance does NOT support creating combo aliases via API.
- GET /v1/combos: empty data array
- POST /v1/combos: HTTP 405 Method Not Allowed
- PUT/PATCH /v1/combos/<id>: HTTP 404 Unknown API route

No combo aliases exist: hermes-free, hermes-credit, hermes-paid, hermes-coding, hermes-auto are not registered.

## hermes-free (Tier 1 - Free)
Providers: free-ai, aihorde, duckduckgo-web, cloudflare-playground
Note: duckduckgo-web and cloudflare-playground have 0 models available.

Primary models:
- free-ai/qwen7b
- free-ai/qwen-coder
- aihorde/google/gemma-4-31b
- aihorde/koboldcpp/gemma-3-4b-it

## hermes-credit (Tier 2 - Prepaid Credit)
Providers: agentrouter, vertex, gemini, antigravity

Primary models:
- agentrouter/claude-opus-4-8
- agentrouter/claude-opus-5
- vertex/gemini-3.7-flash
- vertex/gemini-2.5-pro
- antigravity/gemini-3-flash
- antigravity/claude-sonnet-4-6

## hermes-paid (Tier 3 - Low Cost Paid)
Providers: cheaperinference, literouter, llmgateway, fastrouter

Primary models:
- cheaperinference/claude-haiku-4.5
- cheaperinference/claude-opus-4.5
- literouter/deepseek-v3.1:free
- literouter/deepseek-v4-flash:free
- llmgateway/gpt-4o-mini
- llmgateway/gpt-4o
- fastrouter/fastrouter/auto
- fastrouter/anthropic/claude-sonnet-5.5

## hermes-coding (Code-Focused)
Providers: llmgateway, fastrouter, cheaperinference

Primary models:
- llmgateway/claude-sonnet-4-5
- llmgateway/claude-sonnet-4-6
- llmgateway/claude-sonnet-5
- fastrouter/anthropic/claude-sonnet-5.5
- fastrouter/anthropic/claude-opus-5.5
- cheaperinference/claude-opus-4.5
- cheaperinference/claude-opus-4.6

## hermes-auto (Master Combo - All Tiers)
Priority order: Tier 1 -> Tier 2 -> Tier 3 -> Tier 4

Tier 1 (Free): free-ai/qwen7b, free-ai/qwen-coder, aihorde/google/gemma-4-31b
Tier 2 (Prepaid): agentrouter/claude-opus-4-8, vertex/gemini-3.7-flash, antigravity/gemini-3-flash
Tier 3 (Low Cost): cheaperinference/claude-haiku-4.5, literouter/deepseek-v3.1:free, llmgateway/gpt-4o-mini, fastrouter/fastrouter/auto
Tier 4 (Premium): claude-web/claude-sonnet-5, github/claude-sonnet-5.5, kiro/claude-sonnet-4.5

## Failover Rules (Conceptual - not API-configurable)

OmniRoute does not expose failover rule configuration via API. Failover must be handled by Hermes client logic:
- quota exhausted -> try next provider in tier
- timeout -> try next provider in tier
- authentication error -> try next provider in tier
- provider unavailable -> try next provider in tier

## Recommended Hermes Default Model
Use: auto/cheap (verified live, cost-optimized auto route)
Fallback chain: auto/cheap -> auto/best-fast -> auto/best-chat

## Deprecated
auto/best-coding - deprecated in models.js, do not use.
