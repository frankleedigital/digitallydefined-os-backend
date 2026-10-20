# MODULARIZATION_PLAN.md

**Generated:** 2026-10-19
**Companion to:** `CODEBASE_AUDIT.md`
**Constraint:** No visual redesign. No branding changes. No UX changes. Boundaries only.

---

## 0. Guiding Principle

The current codebase has **features scattered across four runtimes** (Vercel Node, Express Node, Deno Edge, Cloudflare Workers, Python FastAPI) with **no module boundaries**. The goal is to draw boundaries so that:

1. Each feature has **one** home.
2. Each feature has a **declared contract** (inputs, outputs, dependencies).
3. An AI agent can answer "where does X live?" from the folder name alone.

**Nothing is deleted.** Every module below is *moved* or *wrapped*, never removed.

---

## 1. Target Architecture

```
digitallydefined/
├── apps/
│   ├── dashboard/              ← React (existing, restructured)
│   └── store/                  ← digital-products (existing, restructured)
├── modules/                    ← NEW: one directory per feature
│   ├── quiz/
│   ├── roadmaps/
│   ├── niche/
│   ├── scorecard/
│   ├── wealth/
│   ├── reputation/
│   ├── content-repurposer/
│   ├── community/
│   ├── affiliate/
│   ├── product-library/
│   └── agency/
├── services/                   ← NEW: shared infrastructure
│   ├── notion/
│   ├── email/
│   ├── ai/
│   ├── analytics/
│   └── licensing/
├── packages/                   ← NEW: shared contracts
│   ├── types/
│   ├── config/
│   └── ui/
└── infra/
    ├── supabase/               ← canonical edge functions
    └── fastapi/                ← Python microservices
```

**Rule:** `modules/` contains business features. `services/` contains external integrations. `packages/` contains shared contracts. A module may depend on `services/` and `packages/`; a service may depend on `packages/` only.

---

## 2. Module Specifications

### 2.1 Quiz

| Field | Value |
|---|---|
| **Current location** | `os-backend/src/agents/quiz.js` (orphaned), `os-backend/agents/digitalSuperpowerAgent.js` (orphaned), `os-backend/supabase/functions/quiz-submit/index.ts` (89 LOC, live), `os-backend/supabase/functions/quiz-roadmap/index.ts` (18 LOC, live), `workspace/buzz-agents/digital-superpower-quiz/` (unmigrated), `digital-products/src/lib/products.js` entry `digital-superpower-quiz` |
| **Dependencies** | `services/ai` (OmniRoute), `services/notion` (intake DB), `services/email` (roadmap email) |
| **Inputs** | `answers: string[]`, `name?: string`, `email?: string` |
| **Outputs** | `{ superpower, persona, strengths[], businessModel, roadmap }` |
| **Recommended boundary** | `modules/quiz/` — owns scoring, persona mapping, roadmap generation. Calls `services/ai` for interpretation. Emits a `QuizResult` event. |
| **Why** | Five implementations exist. The scoring logic is deterministic and belongs client-side; the interpretation belongs in `services/ai`. |

### 2.2 Roadmaps

| Field | Value |
|---|---|
| **Current location** | `os-backend/src/agents/roadmap.js` (orphaned), `os-backend/agents/roadmapAgent.js` (orphaned), `os-backend/src/schemas/roadmap.js`, `os-backend/roadmaps/index.js` + `store.js`, `os-backend/supabase/functions/_shared/roadmaps-store.ts` (63 LOC), `os-backend/supabase/functions/quiz-roadmap/index.ts`, `workspace/buzz-agents/roadmap-generator/` (archived) |
| **Dependencies** | `services/ai`, `services/notion` (roadmap DB) |
| **Inputs** | `QuizResult`, `niche?`, `marketSignals?` |
| **Outputs** | `{ phases[], estimatedTime, steps[] }` |
| **Recommended boundary** | `modules/roadmaps/` — owns phase structure and step generation. Persists via `services/notion`. |
| **Why** | Six locations. `roadmaps-store.ts` is the only live persistence path; the rest are dead. |

### 2.3 SEO Tools

| Field | Value |
|---|---|
| **Current location** | `os-backend/fastapi/app/routers/domain.py` (`/analyze`), `os-backend/fastapi/app/services/domain_whois.py`, `os-backend/fastapi/app/models/domain.py`, `digital-products/src/lib/products.js` entry `domain-analyzer` |
| **Dependencies** | `python-whois`, `services/ai` |
| **Inputs** | `domain: string` |
| **Outputs** | `{ age, registrar, authority, recommendations[] }` |
| **Recommended boundary** | `modules/seo/domain/` — FastAPI router stays, but the *contract* moves to `packages/types`. |
| **Why** | The only FastAPI router with a real external dependency. Currently unreachable due to the `config` import bug. |

### 2.4 Wealth Calculator

| Field | Value |
|---|---|
| **Current location** | `os-backend/fastapi/app/routers/wealth.py` (`/calculate`), `os-backend/fastapi/app/services/wealth_service.py`, `os-backend/fastapi/app/models/wealth.py`, `os-backend/src/agents/` (no wealth agent), `digital-products/src/lib/products.js` entry `wealth-calculator` |
| **Dependencies** | None (deterministic) |
| **Inputs** | `{ currentSavings, monthlyContribution, yearsToRetirement, expectedReturn }` |
| **Outputs** | `{ projectedValue, shortfall, requiredMonthly }` |
| **Recommended boundary** | `modules/wealth/` — pure function, no I/O. |
| **Why** | Deterministic math with no external calls. Belongs in `packages/` or `modules/` as a pure function, not a FastAPI service. |

### 2.5 Reputation Intelligence

| Field | Value |
|---|---|
| **Current location** | `os-backend/supabase/functions/reputation/index.ts` (67 LOC, live), `os-backend/src/services/` (no reputation service), `os-backend/agents/` (no reputation agent), `workspace/buzz-agents/` (no reputation agent), `digital-products/src/lib/products.js` entry `reputation-command-center`, `dashboard/src/components/intelligence/` (no reputation view) |
| **Dependencies** | `services/ai` (Gemini), review source (currently hardcoded) |
| **Inputs** | `businessName`, `reviewSources[]` |
| **Outputs** | `{ sentimentIndex, reviewCount, topThemes[], alerts[] }` |
| **Recommended boundary** | `modules/reputation/` — owns sentiment analysis and alerting. |
| **Why** | The only live implementation is a 67-LOC edge function. The dashboard renders `data.reviews` from `config.js` constants. |

### 2.6 Content Repurposer

| Field | Value |
|---|---|
| **Current location** | `workspace/buzz-agents/content-repurposer/` (agent.js, prompt.md, schema.json — unmigrated), `os-backend/src/agents/` (no content agent), `os-backend/supabase/functions/content/index.ts` (72 LOC, live, website content only) |
| **Dependencies** | `services/ai` |
| **Inputs** | `{ sourceContent, targetFormats[] }` |
| **Outputs** | `{ email, blog, social, script }` |
| **Recommended boundary** | `modules/content-repurposer/` |
| **Why** | Documented as "no equivalent anywhere in active projects" in `POST_CLEANUP_ARCHITECTURE.md`. The buzz agent is the only implementation. |

### 2.7 Community Intelligence

| Field | Value |
|---|---|
| **Current location** | `workspace/buzz-agents/facebook-community-agent/` (unmigrated), `os-backend/src/services/facebook.js` (**0 bytes**), `os-backend/supabase/functions/_shared/community-helpers.ts` (314 LOC), `os-backend/supabase/functions/_shared/community-triggers.ts` (304 LOC), `os-backend/lib/community-helpers.js`, `os-backend/lib/community-triggers.js`, `dashboard/src/lib/integrations/community.js` |
| **Dependencies** | Facebook Graph API, Discord API, Mighty Networks API |
| **Inputs** | `platform`, `groupId` |
| **Outputs** | `{ memberCount, activityScore, trendingTopics[], needs[], healthScore, riskAlerts[] }` |
| **Recommended boundary** | `modules/community/` — owns platform adapters and analysis. |
| **Why** | `POST_CLEANUP_ARCHITECTURE.md` §3 says the backend has "only basic `fetchFacebookGroup()` stats, not the full analysis agent." The full agent exists only in `workspace/`. |

### 2.8 Affiliate Center

| Field | Value |
|---|---|
| **Current location** | `os-backend/fastapi/app/routers/affiliate.py` (`/flip`), `os-backend/fastapi/app/services/affiliate_service.py`, `os-backend/fastapi/app/models/affiliate.py`, `os-backend/agents/affiliateFlipAgent.js` (orphaned), `dashboard/src/lib/affiliateExport.js`, `dashboard/public/affiliate-flip-calculator.html` (425 LOC), `digital-products/src/lib/products.js` entry `affiliate-flipper` |
| **Dependencies** | `services/ai` |
| **Inputs** | `{ productUrl, niche, budget }` |
| **Outputs** | `{ flipPotential, estimatedMargin, recommendations[] }` |
| **Recommended boundary** | `modules/affiliate/` |
| **Why** | The dashboard has a 425-LOC standalone HTML calculator; the backend has a FastAPI router; the agent registry has an orphaned agent. Three implementations of one feature. |

### 2.9 Product Library

| Field | Value |
|---|---|
| **Current location** | `digital-products/src/lib/products.js` (369 LOC, 25 entries), `digital-products/src/lib/productCatalog.js` (14 LOC re-export), `os-backend/fastapi/app/data/products.py` (394 LOC), `os-backend/fastapi/app/services/product_generator.py`, `os-backend/fastapi/app/services/product_packager.py`, `os-backend/src/agents/product.js`, `os-backend/src/routes/product.js` |
| **Dependencies** | `services/ai`, `services/licensing` (Gumroad) |
| **Inputs** | `{ topic, niche, format }` |
| **Outputs** | `{ productConcept, features[], launchStrategy, packagedAsset }` |
| **Recommended boundary** | `modules/product-library/` — owns the catalog contract. |
| **Why** | The catalog exists in two languages with **different price points**. `products.js` is the storefront source of truth; `products.py` is the backend source of truth. |

### 2.10 Agency Portal

| Field | Value |
|---|---|
| **Current location** | `dashboard/src/configMerge.js` (134 LOC white-label merge), `dashboard/public/customer-config.js` (191 LOC), `dashboard/src/brand/dd-brand-tokens.js`, `dashboard/src/brand/dd-brand-audit.js`, `dashboard/public/WHITE-LABEL-DASHBOARD-SUMMARY.md` (268 LOC) |
| **Dependencies** | `packages/config` |
| **Inputs** | `{ businessName, primaryColor, secondaryColor, tagline, ... }` |
| **Outputs** | Merged config object |
| **Recommended boundary** | `modules/agency/` |
| **Why** | The white-label system is fully built but has no customers. It should be a module with a clear contract, not scattered across `configMerge.js` + `customer-config.js` + `brand/`. |

---

## 3. Service Extraction

### 3.1 `services/notion/`

**Current:** 19 files across 3 projects call `api.notion.com`.

**Extract to:**
```
services/notion/
├── client.ts          ← single Notion REST client
├── schema.ts          ← DB schemas + property builders
├── mapper.ts          ← property-name normalization
├── architect.ts       ← DB design/reconcile
└── index.ts
```

**Absorbs:** `lib/notion-client.js`, `lib/notion-client.mjs`, `lib/notion-schema.js`, `lib/notion-write.js`, `lib/notion-write.mjs`, `lib/notion-architect.js`, `lib/notion-properties.mjs`, `_shared/notion-client.ts`, `_shared/notion-schema.ts`, `_shared/notion-write.ts`, `_shared/notion-architect.ts`, `os-workers/src/notion/client.ts`, `os-workers/src/notion/mapper.ts`, `os-workers/src/notion/schema.ts`, `fastapi/app/notion_architect.py`, `dashboard/src/lib/notion.js`, `dashboard/src/lib/notionArchitect.js`, `dashboard/src/lib/notionConfig.js`, `dashboard/src/utils/notionMapper.js`

**Contract:**
```ts
interface NotionService {
  query(dbId: string, filter?: Filter): Promise<Page[]>;
  createPage(dbId: string, props: Properties): Promise<Page>;
  updatePage(pageId: string, props: Properties): Promise<Page>;
  reconcile(dbId: string, schema: Schema): Promise<ReconcileReport>;
}
```

### 3.2 `services/email/`

**Current:** 4 providers, 12 implementations.

**Extract to:**
```
services/email/
├── types.ts           ← EmailProvider interface
├── brevo.ts           ← LIVE provider
├── index.ts
└── (mailchimp.ts, sendgrid.ts — retained but marked deprecated)
```

**Contract:**
```ts
interface EmailProvider {
  sendTransactional(to: string, template: string, vars: Record<string, string>): Promise<Result>;
  upsertContact(listId: string, email: string, props: Record<string, string>): Promise<Result>;
  getListStats(listId: string): Promise<ListStats>;
}
```

### 3.3 `services/ai/`

**Current:** 8 AI-call paths.

**Extract to:**
```
services/ai/
├── router.ts          ← OmniRoute-only routing
├── client.ts          ← HTTP client with timeout/retry
├── cache.ts           ← response cache
└── index.ts
```

**Contract:**
```ts
interface AiService {
  chat(messages: Message[], opts?: ChatOpts): Promise<Completion>;
  json<T>(prompt: string, schema: ZodSchema<T>): Promise<T>;
  embed(text: string): Promise<number[]>;
}
```

**Absorbs:** `src/services/aiRouter.js`, `src/services/ai.js`, `lib/llmClient.js`, `_shared/omniroute.ts`, `_shared/aiRouter.ts`, `_shared/ai-client.ts`, `ai/gateway/router.ts`, `ai/gateway/client.ts`, `fastapi/app/llm.py`, `api/index.js` inline `AI_PROVIDERS`

### 3.4 `services/analytics/`

**Current:** `os-backend/supabase/functions/analytics/index.ts` (550 LOC), `dashboard/src/lib/analytics.js`, `dashboard/src/lib/integrations/google-analytics.js`, `os-backend/src/services/` (no analytics), `os-backend/lib/sync-aggregator.js` (GA section)

**Extract to:** `services/analytics/` — GA4 + Supabase analytics events.

### 3.5 `services/licensing/`

**Current:** `dashboard/src/lib/premium.js`, `os-backend/src/services/premium.js`, `os-backend/supabase/functions/hermes/index.ts` (`license.verify` action), `os-backend/lib/sellable-auth.js`, `_shared/sellable-auth.ts`

**Extract to:** `services/licensing/` — Gumroad license verification + entitlement cache.

**Contract:**
```ts
interface LicensingService {
  verify(licenseKey: string, email?: string): Promise<Entitlement>;
  getCached(): Entitlement | null;
  clearCache(): void;
}
```

---

## 4. Package Extraction

### 4.1 `packages/types/`

**Current:** `os-backend/src/types/` is **empty**. `os-workers/src/types.ts` (226 LOC) is the only typed contract and belongs to an orphaned project.

**Extract to:** `packages/types/` — shared TypeScript definitions for every action, every module input/output, every service contract.

### 4.2 `packages/config/`

**Current:** 5 places brand tokens live:
- `dashboard/src/config.js` (446 LOC)
- `dashboard/src/configMerge.js` (134 LOC)
- `dashboard/src/theme.js`
- `dashboard/src/index.css` (15 `--dd-*` custom props)
- `dashboard/public/customer-config.js` (191 LOC)

**Extract to:** `packages/config/` — single source of truth, consumed by `theme.js` and `index.css`.

### 4.3 `packages/ui/`

**Current:** `dashboard/src/components/ui/` (exists, thin), `dashboard/src/components/intelligence/` (10 view components, no shared primitives), `dashboard/src/theme.js` (style objects).

**Extract to:** `packages/ui/` — `Card`, `Button`, `Eyebrow`, `Heading`, `Stat`, `Table`, `Tabs`. Every component currently hand-rolls these.

---

## 5. Migration Order

| Phase | Modules | Effort |
|---|---|---|
| **1** | `services/notion`, `services/email`, `services/ai` | Medium — highest duplication, clearest contracts |
| **2** | `packages/types`, `packages/config` | Medium — unblocks everything else |
| **3** | `modules/quiz`, `modules/roadmaps`, `modules/scorecard` | Medium — the funnel core |
| **4** | `modules/wealth`, `modules/niche`, `modules/seo` | Low — deterministic, few dependencies |
| **5** | `modules/reputation`, `modules/community`, `modules/content-repurposer` | High — external API dependencies |
| **6** | `modules/affiliate`, `modules/product-library`, `modules/agency` | High — cross-project |

**Rule:** no module moves until its service dependencies have moved. `modules/quiz` cannot move before `services/ai` and `services/notion`.

---

## 6. What NOT to Modularize

| Candidate | Why not |
|---|---|
| `os-backend/src/routes/` | Orphaned. Do not modularize dead code — resolve the orphan decision first (see `CODEBASE_AUDIT.md` §1.1). |
| `os-backend/agents/` | Orphaned. Same reason. |
| `os-workers/` | Orphaned. Either connect it or retire it; do not modularize an unconnected service. |
| `dashboard/src/pages/tabs/` | Empty files. Delete, don't modularize. |
| `dashboard/dev/null` | Build artifact. Delete, don't modularize. |
| `supabase/` (root) | Retired. Delete after confirming the two diverged functions are reconciled. |
