# AGENT_MIGRATION_AUDIT.md

**Generated:** 2026-10-19
**Source:** `workspace/buzz-agents/` (9 agents + shared lib)
**Target Projects:** digital-products, digitallydefined-dashboard, digitallydefined-os-backend, digitallydefined-os-workers
**STATUS:** AUDIT ONLY — Do NOT delete or archive anything until approved.

## Executive Summary

| Metric | Count |
|--------|-------|
| Total buzz agents | 9 |
| Fully migrated (active code exists elsewhere) | 5 |
| Partially migrated (core logic moved, UI/integration remaining) | 2 |
| Not migrated (no active code elsewhere) | 2 |
| Superseded by backend edge functions | 3 |
| Safe to archive (migrated + redundant) | 7 |
| Safe to delete (migrated + fully replaced) | 5 |
| Require manual review | 2 |

## Project-by-Project Migration Map

### digitallydefined-os-backend (THE BACKEND)

| Buzz Agent | Backend Equivalent | Status |
|------------|-------------------|--------|
| ai-rankand-rent-builder | `api/index.js` route `rankrent: '/rank-rent/analyze'` | Migrated |
| content-repurposer | None | Not migrated |
| digital-superpower-quiz | `quiz.complete` action + `supabase/functions/quiz-submit/` | Partially migrated |
| digital-wealth-calculator | `api/index.js` route `wealth: '/wealth/calculate'` | Migrated |
| facebook-community-agent | `api/index.js` `fetchFacebookGroup()` (basic only) | Partially migrated |
| json-schema-generator | None | Not migrated |
| niche-keyword-discovery | `api/index.js` route `niche: '/niche/score'` | Migrated |
| reputation-intelligence | `supabase/functions/reputation/index.ts` | Migrated |
| roadmap-generator | `api/index.js` route `roadmap: '/roadmap/generate'` + `quiz-roadmap/` + `quiz-submit/` | Migrated |

**Backend routes that absorb buzz agent functionality:**
- `quiz.complete` — Quiz submission
- `niche: /niche/score` — Niche discovery
- `rankrent: /rank-rent/analyze` — Rank & rent builder
- `roadmap: /roadmap/generate` — Roadmap generator
- `wealth: /wealth/calculate` — Wealth calculator
- `reputation` — Reputation intelligence (Supabase edge function)
- `intelligence` — Aggregated dashboard intelligence
- `antigravity.*` — AntiGravity workflow triggers

### digitallydefined-dashboard

Dashboard is a thin client. All agent logic lives in the backend; dashboard calls `callSupabaseEdge()` to reach `https://digitallydefined-os-backend.vercel.app`.

| Buzz Agent | Dashboard Equivalent | Status |

## Detailed Agent Audits

### 1. ai-rankand-rent-builder

| Field | Detail |
|-------|--------|
| **Purpose** | Generate a rank-and-rent digital asset plan (SEO + content + monetization). Input: niche, keywords, competitionLevel. Output: keywordClusters, contentPlan, monetizationStrategy. |
| **Current functionality** | Calls OmniRoute via `generateResponse()`, validates input, parses JSON output. Standalone agent. |
| **Active code elsewhere** | **YES — Backend.** `digitallydefined-os-backend/api/index.js` has route `rankrent: '/rank-rent/analyze'`. |
| **Exact destination if migrated** | `digitallydefined-os-backend/` — route `/rank-rent/analyze` in `api/index.js` |
| **Files unique to this agent** | `agent.js` (1,306 B), `prompt.md` (757 B), `README.md` (984 B), `schema.json` (644 B) |
| **Safe to archive** | YES — Backend route supersedes this agent |
| **Safe to delete** | YES — After confirming backend route is tested and active |

### 2. content-repurposer

| Field | Detail |
|-------|--------|
| **Purpose** | Transform one piece of content into multiple formats (email, blog, social, script). Input: content string, targetFormats array. Output: repurposedContent object. |
| **Current functionality** | Calls OmniRoute via `generateResponse()`, validates input, parses JSON output. Standalone agent. |

### 3. digital-superpower-quiz

| Field | Detail |
|-------|--------|
| **Purpose** | Identify user's digital superpower through 7-question personality quiz. Classifies into Builder/Creator/Educator/Strategist/Connector. Recommends pathways. |
| **Current functionality** | Async quiz agent. Calls OmniRoute, saves results to Supabase via `saveQuizResult()`, validates output schema. |
| **Active code elsewhere** | **PARTIAL — Backend.** Backend has `quiz.complete` action in `api/index.js`, `quiz-submit` supabase function (scores answers, upserts lead, generates roadmap via OmniRoute/Gemini, stores roadmap, sends Brevo email). Dashboard `IntelligencePage.jsx` calls `callSupabaseEdge("intelligence", ...)` which reads quiz data. Dashboard `App.jsx` redirects `/quiz` to public site (digitallydefined-online-local — being removed). Digital products has `/quiz` route but only as ProductShell shell. |
| **Exact destination if migrated** | Backend `quiz-submit` supabase function + `quiz.complete` API action. Dashboard needs to re-point `/quiz` from public site to backend after `digitallydefined-online-local` is removed. |
| **Files unique to this agent** | `agent.js` (2,980 B), `prompt.md` (3,155 B), `README.md` (1,433 B), `schema.json` (1,627 B) |
| **Safe to archive** | YES — Core logic migrated to backend `quiz-submit` function |
| **Safe to delete** | PARTIAL — Agent code is superseded by backend, but quiz UI flow needs backend endpoint confirmation after `online-local` removal |

### 4. digital-wealth-calculator

| Field | Detail |
|-------|--------|
| **Purpose** | Calculate digital asset revenue potential. Input: niche, audienceSize, productType, pricing. Output: revenueProjection, growthModel, recommendedPricing. |
| **Current functionality** | Calls OmniRoute, validates input, saves data to Supabase, parses JSON output. |
| **Active code elsewhere** | **YES — Backend.** `digitallydefined-os-backend/api/index.js` has route `wealth: '/wealth/calculate'`. Dashboard footer references "Free Calculator". |
| **Exact destination if migrated** | `digitallydefined-os-backend/` — route `/wealth/calculate` in `api/index.js` |
| **Files unique to this agent** | `agent.js` (1,419 B), `prompt.md` (804 B), `README.md` (1,039 B), `schema.json` (721 B) |
| **Safe to archive** | YES — Backend route `/wealth/calculate` supersedes this agent |
| **Safe to delete** | YES — After confirming backend route is tested and active |

### 5. facebook-community-agent

| Field | Detail |
|-------|--------|
| **Purpose** | Monitor/analyze Facebook Community. Input: communityPosts, timeRange, engagementMetrics, memberQuestions, moderationFlags. Output: trendingTopics, memberNeeds, contentRecommendations, communityHealthScore, riskAlerts, summaryDigest. |

### 6. json-schema-generator

| Field | Detail |
|-------|--------|
| **Purpose** | Generate clean, validated JSON schemas. Input: descriptionOfSchema, requiredFields. Output: jsonSchema object, validationRules array. |
| **Current functionality** | Calls OmniRoute via `generateResponse()`, validates input, parses JSON output. |
| **Active code elsewhere** | **NO.** No references to `jsonSchemaGenerator`, `json-schema-generator`, or schema generation found in any active project. |
| **Exact destination if migrated** | Not migrated. |
| **Files unique to this agent** | `agent.js` (1,290 B), `prompt.md` (642 B), `README.md` (824 B), `schema.json` (731 B) |
| **Safe to archive** | YES — No active references |
| **Safe to delete** | NO — Not migrated. Archive first. |

### 7. niche-keyword-discovery

| Field | Detail |
|-------|--------|
| **Purpose** | Find profitable niches and keyword clusters. Input: interests, constraints, audienceType. Output: nicheList, keywordClusters, difficultyScores. |
| **Current functionality** | Calls OmniRoute via `generateResponse()`, validates input, parses JSON output. |
| **Active code elsewhere** | **YES — Backend.** `digitallydefined-os-backend/api/index.js` has route `niche: '/niche/score'`. |
| **Exact destination if migrated** | `digitallydefined-os-backend/` — route `/niche/score` in `api/index.js` |
| **Files unique to this agent** | `agent.js` (1,348 B), `prompt.md` (813 B), `README.md` (1,065 B), `schema.json` (672 B) |
| **Safe to archive** | YES — Backend route `/niche/score` supersedes this agent |
| **Safe to delete** | YES — After confirming backend route is tested and active |

### 8. reputation-intelligence

| Field | Detail |
|-------|--------|
| **Purpose** | Analyze digital footprint and generate reputation improvement plan. Input: socialProfiles, website, contentSamples. Output: reputationScore, riskFactors, improvementPlan. |
| **Current functionality** | Calls OmniRoute via `generateResponse()`, validates input, parses JSON output. |
| **Active code elsewhere** | **YES — Backend.** `digitallydefined-os-backend/supabase/functions/reputation/index.ts` is a Deno edge function that evaluates niche reputation signals. Dashboard has a reputation tab (`ShieldCheck` icon) and `reputation-intelligence` is referenced in backend schemas. |
| **Exact destination if migrated** | `digitallydefined-os-backend/supabase/functions/reputation/` |
| **Files unique to this agent** | `agent.js` (1,371 B), `prompt.md` (754 B), `README.md` (1,046 B), `schema.json` (707 B) |
| **Safe to archive** | YES — Backend edge function supersedes this agent |
| **Safe to delete** | YES — After confirming backend edge function is tested and active |

### 9. roadmap-generator

| Field | Detail |

## Shared Lib Files Audit

| File | Purpose | Active Elsewhere? | Destination | Safe to Archive | Safe to Delete |
|------|---------|-------------------|-------------|-----------------|----------------|
| `lib/anti-gravity.js` | AntiGravity workflow triggers | YES — Backend imports `antigravityHandle` from `../lib/antigravity.js` | `digitallydefined-os-backend/lib/antigravity.js` | YES | YES |
| `lib/omniroute.js` | OmniRoute AI client | YES — Backend calls OmniRoute directly | `digitallydefined-os-backend/` | YES | YES |

## Project-by-Project Migration Summary

### digitallydefined-os-backend (THE BACKEND)

| Buzz Agent | Backend Equivalent | Status |
|------------|-------------------|--------|
| ai-rankand-rent-builder | `api/index.js` route `rankrent: '/rank-rent/analyze'` | Migrated |
| content-repurposer | None | Not migrated |
| digital-superpower-quiz | `quiz.complete` action + `supabase/functions/quiz-submit/` | Partially migrated |
| digital-wealth-calculator | `api/index.js` route `wealth: '/wealth/calculate'` | Migrated |
| facebook-community-agent | `api/index.js` `fetchFacebookGroup()` (basic only) | Partially migrated |
| json-schema-generator | None | Not migrated |
| niche-keyword-discovery | `api/index.js` route `niche: '/niche/score'` | Migrated |
| reputation-intelligence | `supabase/functions/reputation/index.ts` | Migrated |
| roadmap-generator | `api/index.js` route `roadmap: '/roadmap/generate'` + `quiz-roadmap/` + `quiz-submit/` | Migrated |

**Backend routes/endpoints that absorb buzz agent functionality:**
- `quiz.complete` — Quiz submission
- `niche: /niche/score` — Niche discovery
- `rankrent: /rank-rent/analyze` — Rank & rent builder
- `roadmap: /roadmap/generate` — Roadmap generator

### digitallydefined-dashboard

Dashboard is a thin client. All agent logic lives in the backend; dashboard calls `callSupabaseEdge()` to reach `https://digitallydefined-os-backend.vercel.app`.

| Buzz Agent | Dashboard Equivalent | Status |
|------------|-------------------|--------|
| digital-superpower-quiz | `App.jsx` redirects `/quiz` to public site (digitallydefined-online-local — being removed). `IntelligencePage.jsx` reads quiz results from localStorage and calls backend `intelligence` action. | UI not migrated; quiz flow depends on `online-local` |
| digital-wealth-calculator | Footer "Free Calculator" link | Referenced but not implemented in dashboard |
| facebook-community-agent | `src/lib/integrations.js` `fetchCommunityStats()` | Partial (stats only) |
| reputation-intelligence | Reputation tab (`ShieldCheck` icon in DashboardPage) | UI present, logic in backend |
| roadmap-generator | `IntelligencePage.jsx` displays roadmap from backend | UI present, logic in backend |

**Dashboard depends on backend for all agent logic.** Dashboard is a thin client that calls `callSupabaseEdge()` to reach `https://digitallydefined-os-backend.vercel.app`.

### digital-products

| Buzz Agent | Digital Products Equivalent | Status |
|------------|---------------------------|--------|
| All 9 agents | None directly. `App.jsx` has `/quiz` route mapping to ProductShell. `src/lib/products.js` has product catalog. | No agent logic in digital-products |

## Consolidated Recommendations

### Agents Safe to Archive (migrated to backend):
1. `ai-rankand-rent-builder` → Backend `/rank-rent/analyze`
2. `digital-superpower-quiz` → Backend `quiz-complete` + `quiz-submit`
3. `digital-wealth-calculator` → Backend `/wealth/calculate`
4. `niche-keyword-discovery` → Backend `/niche/score`
5. `reputation-intelligence` → Backend `reputation` edge function
6. `roadmap-generator` → Backend `/roadmap/generate` + `quiz-roadmap`
7. `lib/anti-gravity.js` → Backend `lib/antigravity.js`
8. `lib/omniroute.js` → Backend OmniRoute integration
9. `lib/supabase.js` → Backend `@supabase/supabase-js`
10. `lib/validator.js` → Backend validation modules

### Agents NOT Safe to Delete (not migrated):
1. `content-repurposer` — No equivalent anywhere
2. `json-schema-generator` — No equivalent anywhere
3. `facebook-community-agent` — Partial migration only (basic Facebook fetch, no full analysis)

### Dashboard Quiz Flow Issue
The dashboard `App.jsx` redirects `/quiz` to `PUBLIC_QUIZ` (the public site in `digitallydefined-online-local`, which is slated for removal). After removing `online-local`, the dashboard must either:
- Implement its own quiz UI, OR
- Point `/quiz` to the backend's quiz endpoint, OR
- Remove the quiz route entirely

## Final Audit Summary

| Category | Count | Agents |
|----------|-------|--------|
| Fully migrated to backend | 5 | ai-rankand-rent-builder, digital-wealth-calculator, niche-keyword-discovery, reputation-intelligence, roadmap-generator |
| Partially migrated | 2 | digital-superpower-quiz, facebook-community-agent |
| Not migrated | 2 | content-repurposer, json-schema-generator |
| Lib files migrated | 4 | anti-gravity.js, omniroute.js, supabase.js, validator.js |

**Safe to archive:** 7 agents + 4 lib files (all except content-repurposer, json-schema-generator, facebook-community-agent which need further review)

**Safe to delete (after backend verification):** 5 agents (ai-rankand-rent-builder, digital-wealth-calculator, niche-keyword-discovery, reputation-intelligence, roadmap-generator)

**Do NOT delete yet:** content-repurposer, json-schema-generator, facebook-community-agent, digital-superpower-quiz (pending dashboard quiz flow resolution)


**Digital products is a storefront (React + Vite).** It does not contain buzz agent logic. It relies on the backend for license verification (`license.verify` action).

### digitallydefined-os-workers

| Buzz Agent | Workers Equivalent | Status |
|------------|-------------------|--------|
| All 9 agents | None | No references found |

**Workers is a Cloudflare Workers project.** No buzz agent code found. Not part of the 3-target architecture.

- `wealth: /wealth/calculate` — Wealth calculator
- `reputation` — Reputation intelligence (Supabase edge function)
- `intelligence` — Aggregated dashboard intelligence
- `antigravity.*` — AntiGravity workflow triggers

| `lib/supabase.js` | Supabase client | YES — Backend uses `@supabase/supabase-js` extensively | `digitallydefined-os-backend/` | YES | YES |
| `lib/validator.js` | Input validation | YES — Backend has validation in `src/services/validation.js` | `digitallydefined-os-backend/` | YES | YES |

|-------|--------|
| **Purpose** | Generate personalized digital roadmap based on superpower. Input: superpowerName, userGoals, skillLevel. Output: 30dayRoadmap, 90dayRoadmap, recommendedTools, milestoneBreakdown. |
| **Current functionality** | Calls OmniRoute, saves data to Supabase, validates input, parses JSON output. |
| **Active code elsewhere** | **YES — Backend.** `digitallydefined-os-backend/api/index.js` has route `roadmap: '/roadmap/generate'`. `supabase/functions/quiz-roadmap/index.ts` retrieves roadmaps by email. `supabase/functions/quiz-submit/index.ts` generates roadmaps via OmniRoute/Gemini. Dashboard `IntelligencePage.jsx` displays roadmap data from backend `intelligence` action. |
| **Exact destination if migrated** | `digitallydefined-os-backend/` — route `/roadmap/generate` in `api/index.js`, plus `supabase/functions/quiz-roadmap/` and `quiz-submit/` |
| **Files unique to this agent** | `agent.js` (1,405 B), `prompt.md` (957 B), `README.md` (1,073 B), `schema.json` (813 B) |
| **Safe to archive** | YES — Backend routes and edge functions supersede this agent |
| **Safe to delete** | YES — After confirming backend routes are tested and active |

| **Current functionality** | Calls OmniRoute for sentiment/topic analysis, saves to Supabase, triggers AntiGravity workflows for weekly digests and risk alerts. |
| **Active code elsewhere** | **PARTIAL — Backend.** Backend `api/index.js` has `fetchFacebookGroup()` function (Graph API group stats). Dashboard `src/lib/integrations.js` has `fetchCommunityStats`. But the full agent logic (trendingTopics, memberNeeds, contentRecommendations, communityHealthScore, riskAlerts, summaryDigest) is NOT reimplemented anywhere. |
| **Exact destination if migrated** | Not fully migrated. Backend has basic Facebook API fetch but not the full analysis agent. |
| **Files unique to this agent** | `agent.js` (3,078 B), `prompt.md` (1,346 B), `README.md` (1,421 B), `schema.json` (2,590 B) |
| **Safe to archive** | YES — Partial migration exists (Facebook API fetch), but full agent logic not replaced |
| **Safe to delete** | NO — Not fully migrated. Archive first. |

| **Active code elsewhere** | **NO.** No references to `contentRepurposer`, `content-repurposer`, or content repurposing found in dashboard, backend, digital-products, or workers. |
| **Exact destination if migrated** | Not migrated. Would need to be added to backend as a new route/action, or to digital-products as a tool. |
| **Files unique to this agent** | `agent.js` (1,307 B), `prompt.md` (717 B), `README.md` (940 B), `schema.json` (646 B) |
| **Safe to archive** | YES — No active references, but functionality may be wanted in future |
| **Safe to delete** | NO — Not migrated; functionality not present elsewhere. Archive first. |

|------------|-------------------|--------|
| digital-superpower-quiz | `App.jsx` redirects `/quiz` to public site (being removed). `IntelligencePage.jsx` reads quiz data from localStorage, calls backend `intelligence` action. | UI not migrated |
| digital-wealth-calculator | Footer "Free Calculator" link | Referenced, not implemented |
| facebook-community-agent | `src/lib/integrations.js` `fetchCommunityStats()` | Partial (stats only) |
| reputation-intelligence | Reputation tab (`ShieldCheck` icon) | UI present, logic in backend |
| roadmap-generator | `IntelligencePage.jsx` displays roadmap from backend | UI present, logic in backend |

### digital-products

Storefront (React + Vite). No buzz agent logic. `App.jsx` has `/quiz` route mapping to ProductShell (shell only). Relies on backend for `license.verify`.

### digitallydefined-os-workers

No buzz agent code found. Not part of the 3-target architecture.
