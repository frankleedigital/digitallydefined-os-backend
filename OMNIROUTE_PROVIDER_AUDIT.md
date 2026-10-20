# OMNIROUTE PROVIDER AUDIT

## Source of Truth
OmniRoute Endpoint: http://localhost:20128/v1
Total Models Discovered: 5561
Total Providers: 45


## TIER 1 - FREE

| Provider | Status | Model Count | Quota Status | Recommended Priority |
|---|---|---|---|---|
| free-ai | Active | 586 | Unknown | 1 - Highest (free) |
| aihorde | Active | 219 | Unknown | 2 - Free |
| duckduckgo-web | Active | 6 | Unknown | 3 - Free |
| cloudflare-playground | Active | 20 | Unknown | 4 - Free |

## TIER 2 - PREPAID CREDIT

| Provider | Status | Model Count | Quota Status | Recommended Priority |
|---|---|---|---|---|
| agentrouter | Active | 13 | Unknown | 1 - Prepaid credit |
| antigravity | Active | 16 | Unknown | 2 - Prepaid credit |
| vertex | Active | 87 | Degraded (quota exhausted — resets automatically) | 3 - Prepaid credit |
| gemini | Active | 4 | Unknown | 4 - Prepaid credit |

## TIER 3 - LOW COST PAID

| Provider | Status | Model Count | Quota Status | Recommended Priority |
|---|---|---|---|---|
| cheaperinference | Active | 191 | Unknown | 1 - Low cost paid |
| literouter | Active | 1419 | Unknown | 2 - Low cost paid |
| llmgateway | Active | 349 | Unknown | 3 - Low cost paid |
| fastrouter | Active | 236 | Unknown | 4 - Low cost paid |

## TIER 4 - PREMIUM

| Provider | Status | Model Count | Quota Status | Recommended Priority |
|---|---|---|---|---|
| claude-web | Active | 88 | Unknown | 1 - Premium (last resort) |
| github | Active | 134 | Unknown | 2 - Premium |
| kiro | Active | 34 | Unknown | 3 - Premium |
| gemini-web | Active | 6 | Unknown | 4 - Premium |

## ADDITIONAL PROVIDERS (Not in Tier Classification)

| Provider | Model Count |
|---|---|
| agnes | 20 |
| anyapi | 5 |
| auggie | 28 |
| bluesminds | 38 |
| bytez | 3 |
| cloudcode-one | 2 |
| cloudflare-ai | 18 |
| codex-app-server | 44 |
| combo | 45 |
| deepseek-web | 28 |
| devin-cli-agentic | 127 |
| devin-desktop | 93 |
| firecrawl | 4 |
| freemodel-dev | 8 |
| huggingface | 286 |
| jina-ai | 13 |
| jules | 1 |
| kilocode | 934 |
| llm7 | 76 |
| lmarena | 113 |
| mistral | 47 |
| mixlayer | 6 |
| muse-spark-web | 6 |
| naga-ac | 22 |
| notion-web | 34 |
| nous-research | 14 |
| nvidia | 22 |
| perplexity-web | 22 |
| t3-web | 46 |
| uncloseai | 1 |
| veoaifree-web | 2 |
| zcode | 14 |


## PHASE 5 - COMBO DEFINITIONS

### hermes-free
Uses free providers only.
- Providers: free-ai, aihorde, duckduckgo-web, cloudflare-playground
- Models: auto/best-free, auto/best-fast, auto/best-chat

### hermes-credit
Uses prepaid credit providers.
- Providers: agentrouter, vertex, gemini, antigravity
- Consumes prepaid credits before paid providers.
- Models: vertex/gemini-2.5-pro, vertex/gemini-2.5-flash, agentrouter/*

### hermes-paid
Uses lowest-cost paid inference.
- Providers: cheaperinference, literouter, llmgateway, fastrouter
- Models: cheaperinference/*, literouter/*, llmgateway/*, fastrouter/*

### hermes-coding
Code-focused routing.
- Providers: llmgateway (claude-opus variants), fastrouter, cheaperinference
- Models: llmgateway/claude-opus-4-*, llmgateway/claude-opus-5-*

## Conclusion

OmniRoute running locally in Docker at http://localhost:20128/v1 with 5561 models across 45 providers.
Tier 1 free providers (free-ai, aihorde, duckduckgo-web, cloudflare-playground) should be prioritized for cost minimization.
Vertex AI shows degraded quota status (quota exhausted — resets automatically).

