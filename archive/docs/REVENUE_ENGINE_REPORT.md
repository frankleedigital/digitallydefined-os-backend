# REVENUE_ENGINE_REPORT.md

**Generated:** 2026-10-19
**Companion to:** `CODEBASE_AUDIT.md`
**Method:** Every feature in the four active projects was inventoried, then scored on revenue potential and implementation effort. No code was changed.

---

## 0. Scoring Legend

**Revenue Potential (1–10):** How much recurring or one-time revenue this feature can realistically generate for DigitallyDefined, given the existing audience (Gen X women closing the retirement gap) and the existing pricing ladder ($0 / $27 / $47 / $97 / $197).

**Implementation Effort (1–10):** How much work remains before this feature can collect money. 1 = already collectable. 10 = needs a full build.

**Priority = Revenue Potential − Implementation Effort.** Positive numbers are worth doing first.

---

## 1. Feature Inventory

### 1.1 Dashboard Features

| # | Feature | Location | Revenue Path | Rev | Effort | Priority |
|---|---|---|---|:--:|:--:|:--:|
| 1 | **AI Business Partner** (premium chat) | `AssistantPage.jsx` (323 LOC), `PremiumGate.jsx`, `lib/premium.js` | SaaS subscription $29–99/mo | **9** | **3** | **+6** |
| 2 | **Intelligence Package** (10-view report) | `IntelligencePage.jsx`, `components/intelligence/` (10 views) | Paid report $49–99 | **8** | **4** | **+4** |
| 3 | **Analytics Dashboard** (GA4 + Supabase) | `AnalyticsPage.jsx` (221 LOC), `lib/analytics.js`, `supabase/functions/analytics` (550 LOC) | Premium feature / upsell | **6** | **3** | **+3** |
| 4 | **Notion Vault Sync** (8 databases) | `NotionTab.jsx` (303 LOC), `lib/notion.js`, `lib/notionArchitect.js` (265 LOC) | Premium feature / OS tier | **6** | **4** | **+2** |
| 5 | **Integrations Hub** (GA/social/email/community) | `IntegrationsTab.jsx` (195 LOC), `GrowthTab.jsx` (222 LOC), `lib/integrations/` (7 files) | Premium feature | **5** | **3** | **+2** |
| 6 | **Antigravity / Notion Architect** | `AntigravityPage.jsx` (351 LOC), `lib/antigravity.js` (315 LOC), `lib/notion-architect.js` | Agency service / high-ticket | **7** | **6** | **+1** |
| 7 | **Reputation Command Center** | `config.js` metrics (hardcoded), `supabase/functions/reputation` (67 LOC) | SaaS subscription | **6** | **7** | **−1** |
| 8 | **Model Selector** (AI model switching) | `lib/modelSelector.js`, `api/models`, `api/set-model`, `api/active-model` | Internal tool / cost control | **2** | **2** | **0** |
| 9 | **Thank-You Calculator Page** | `ThankYouCalculatorPage.jsx` (219 LOC) | Funnel step (not direct revenue) | **3** | **2** | **+1** |
| 10 | **Newsletter Signup** | `NewsletterSignup.jsx` | Lead generation | **4** | **2** | **+2** |
| 11 | **Scroll Progress / FadeIn** | `ScrollProgress.jsx`, `FadeInSection.jsx` | None (UX only) | **1** | **1** | **0** |

### 1.2 Backend Features

| # | Feature | Location | Revenue Path | Rev | Effort | Priority |
|---|---|---|---|:--:|:--:|:--:|
| 12 | **Quiz → Roadmap Funnel** | `supabase/functions/quiz-submit` (89), `quiz-roadmap` (18), `src/agents/quiz.js` | Lead magnet → paid roadmap | **8** | **4** | **+4** |
| 13 | **License Verification** (Gumroad) | `supabase/functions/hermes` (`license.verify`), `lib/sellable-auth.js`, `src/services/premium.js` | **Enables all paid features** | **9** | **2** | **+7** |
| 14 | **Notion Architect** (DB design/reconcile) | `lib/notion-architect.js`, `_shared/notion-architect.ts` (637), `fastapi/app/notion_architect.py` (446) | Agency service $197+ | **7** | **6** | **+1** |
| 15 | **Wealth Calculator** | `fastapi/app/routers/wealth.py`, `services/wealth_service.py` | Digital product $27–47 | **6** | **5** | **+1** |
| 16 | **Niche Scorecard** | `fastapi/app/routers/niche.py`, `src/agents/niche.js`, `src/routes/niche.js` | Lead magnet → Pro $9–19/mo | **7** | **4** | **+3** |
| 17 | **Rank & Rent Analyzer** | `fastapi/app/routers/rankrent.py`, `services/rankrent_service.py` | Digital product $27–47 | **6** | **5** | **+1** |
| 18 | **Affiliate Flip Calculator** | `fastapi/app/routers/affiliate.py`, `dashboard/public/affiliate-flip-calculator.html` (425 LOC) | Affiliate opportunity | **5** | **4** | **+1** |
| 19 | **Domain Analyzer** | `fastapi/app/routers/domain.py`, `services/domain_whois.py` | SEO tool / subscription | **5** | **5** | **0** |
| 20 | **Offer Architect** | `fastapi/app/routers/offerarchitect.py`, `services/offer_architect_service.py` | High-ticket service | **6** | **6** | **0** |
| 21 | **Asset Plan** | `fastapi/app/routers/assetplan.py`, `services/asset_plan_service.py` | Premium feature | **5** | **5** | **0** |
| 22 | **Authority Blueprint** | `fastapi/app/routers/blueprint.py`, `services/authority_blueprint.py` | Digital product | **5** | **5** | **0** |
| 23 | **Product Generator** | `fastapi/app/routers/product.py`, `services/product_generator.py` | Agency service | **6** | **6** | **0** |
| 24 | **Schema Validator** | `services/schema_validator.py`, `schemas/*.json` (6 files) | Internal tool | **2** | **2** | **0** |
| 25 | **Trends API** | `fastapi/app/routers/trends.py`, `src/agents/trends.js` | Subscription $19–39/mo | **6** | **6** | **0** |
| 26 | **Knowledge Base** | `fastapi/app/routers/knowledge.py` (7 endpoints), `app/knowledge.py` | Internal / Vectorize search | **3** | **4** | **−1** |
| 27 | **Automation Engine** | `api/index.js` (`automation.*`), `src/workflows/sync.js`, `supabase/functions/followup` | SaaS subscription | **7** | **7** | **0** |
| 28 | **Content Publisher** | `supabase/functions/post-publisher` (109), `_shared/social-publishers.ts` (368) | Automation / subscription | **6** | **6** | **0** |
| 29 | **Website Content Store** | `supabase/functions/content` (72), `src/services/websiteEditor.js` (**0 refs**) | Internal tool | **2** | **3** | **−1** |
| 30 | **Sellable Marketplace** | `supabase/functions/sellable` (65), `_shared/sheets-sellable.ts` (233) | Affiliate / marketplace | **5** | **6** | **−1** |

### 1.3 digital-products (Storefront)

| # | Feature | Location | Revenue Path | Rev | Effort | Priority |
|---|---|---|---|:--:|:--:|:--:|
| 31 | **Product Catalog** (25 entries) | `src/lib/products.js` (369 LOC) | **Storefront — 0 products have UI** | **8** | **8** | **0** |
| 32 | **CloudGate** (Puter auth) | `src/components/CloudGate.jsx` (174 LOC) | **Enables all products** | **7** | **2** | **+5** |
| 33 | **ProductShell** (save/restore) | `src/components/ProductShell.jsx` (225 LOC) | **Enables all products** | **7** | **2** | **+5** |
| 34 | **LauncherHome** (storefront) | `src/components/LauncherHome.jsx` (156 LOC) | Storefront | **6** | **2** | **+4** |
| 35 | **SaveStatus** | `src/components/SaveStatus.jsx` (78 LOC) | UX | **3** | **1** | **+2** |

### 1.4 os-workers (Orphaned)

| # | Feature | Location | Revenue Path | Rev | Effort | Priority |
|---|---|---|---|:--:|:--:|:--:|
| 36 | **Notion Builder Workflow** | `src/workflows/notionBuilder.ts` | Agency service | **6** | **7** | **−1** |
| 37 | **Product Factory Workflow** | `src/workflows/productFactory.ts` | Agency service | **6** | **7** | **−1** |
| 38 | **Workspace Auditor** | `src/workflows/auditor.ts` | Agency service | **5** | **7** | **−2** |
| 39 | **Vectorize Semantic Search** | `src/vectorize/` (2 files) | Internal tool | **3** | **5** | **−2** |
| 40 | **6 Agent Registry** | `src/agents/` (8 files) | Internal tool | **4** | **5** | **−1** |

---

## 2. The Revenue Blockers

### 2.1 Blocker 1: The storefront has no products

`digital-products` declares **25 products**. **Zero define `renderBody`.** Every route renders `ProductBodyFallback`:

> *"Connect the {product.id} implementation here."*

**Revenue at stake:** the entire Gumroad catalog — 9 LIVE products, 12 BACKEND products, 4 PLACEHOLDER products.

**Why it blocks revenue:** a customer can reach `/calculators/roi`, `/tools/niche`, `/business-os`, `/intelligence`, `/ai-partner`, `/analytics`, `/reputation`, `/hermes`, `/quiz` — and see a placeholder. The catalog is a promise the storefront cannot keep.

**Effort to unblock:** the shell (CloudGate, ProductShell, SaveStatus) is **already built and working**. What is missing is 25 `renderBody` functions. The 9 LIVE products map to existing backend agents:

| Product | Backend implementation | UI status |
|---|---|---|
| `digital-superpower-quiz` | `src/agents/quiz.js` | **Missing** |
| `niche-profitability-scorecard` | `src/agents/scorecard.js` | **Missing** |
| `hermes-ai-mentor` | `supabase/functions/hermes` | **Missing** |
| `tenx-roi-calculator` | `dashboard/src/components/RoiCalculator.jsx` (368 LOC) | **Missing** |
| `digital-business-os` | `dashboard/src/pages/NotionTab.jsx` | **Missing** |
| `intelligence-package` | `dashboard/src/components/intelligence/` | **Missing** |
| `ai-business-partner` | `dashboard/src/pages/AssistantPage.jsx` | **Missing** |
| `analytics-dashboard` | `dashboard/src/pages/AnalyticsPage.jsx` | **Missing** |
| `reputation-command-center` | `supabase/functions/reputation` | **Missing** |

**The UI already exists in the dashboard.** The storefront needs to *embed* it, not rebuild it.

### 2.2 Blocker 2: The FastAPI layer is unreachable

`fastapi/app/main.py` cannot import `settings`. All 13 routers, 9 services, 12 models are dead.

**Revenue at stake:** 11 FastAPI routers — `wealth`, `niche`, `rankrent`, `affiliate`, `domain`, `offerarchitect`, `assetplan`, `blueprint`, `product`, `roadmap`, `trends`, `products_api`, `knowledge`.

**Why it blocks revenue:** `api/index.js` has a `fastapi.*` action branch that proxies to `FASTAPI_BASE_URL`. The dashboard can call `fastapi.niche`, `fastapi.wealth`, etc. — and get a connection refused.

**Effort to unblock:** **low.** Rename `config.py` or re-export `settings` from `config/__init__.py`.

### 2.3 Blocker 3: Licensing is the gate, and it is the right gate

`PremiumGate.jsx` wraps `IntelligencePage` and `AssistantPage`. `lib/premium.js` verifies Gumroad licenses via `license.verify`. The entitlement caches for 24h.

**This is correct architecture.** The problem is that the features behind the gate are the ones with the highest revenue potential (AI Business Partner $29–99/mo, Intelligence Package $49–99).

**Revenue at stake:** everything premium.

**Effort to unblock:** the gate works. What is missing is that `license.verify` lives in `supabase/functions/hermes/index.ts` — a 1,709-LOC function with 28 action branches. If that function breaks, **all premium access breaks**.

### 2.4 Blocker 4: Pricing has no source of truth

| Product | `products.js` | `products.py` | Dashboard HTML |
|---|---|---|---|
| Digital Business OS | $97–197 | $97, $297 | — |
| 10x ROI Calculator | $27–47 | $27 | $27, $675, $65 |
| Wealth Calculator | — | $19, $29, $49, $97 | — |
| Intelligence Package | $49–99 | — | — |

A customer seeing `$27` in the storefront and `$675` in the calculator HTML will not buy.

### 2.5 Blocker 5: Hardcoded metrics read as live data

`dashboard/src/config.js`:
```js
metrics: {
  assetValue: "$48,000",
  systemHealth: "100%",
  sentimentIndex: "Positive",
  communityCount: "1,284",
  reviewConversionRate: "24.8%",
  activeLeads: "1,284",
}
```

These render in `MetricCard` components. A customer who checks their GA4 and sees 57 sessions will not trust a dashboard showing 1,284 active leads.

---

## 3. Revenue Potential Matrix

### 3.1 High Potential, Low Effort (do first)

| Feature | Rev | Effort | Priority | Why |
|---|:--:|:--:|:--:|---|
| **License Verification** | 9 | 2 | **+7** | Already built. Extract from `hermes/index.ts` into `services/licensing` so it cannot be broken by unrelated edits. |
| **AI Business Partner** | 9 | 3 | **+6** | `AssistantPage.jsx` exists. `PremiumGate` exists. Needs a checkout link and a subscription tier. |
| **CloudGate + ProductShell** | 7 | 2 | **+5** | Already built. Wire `renderBody` for 3 products and the storefront is live. |
| **LauncherHome** | 6 | 2 | **+4** | Already built. |
| **Quiz → Roadmap Funnel** | 8 | 4 | **+4** | `quiz-submit` and `quiz-roadmap` edge functions are live. Needs the storefront UI. |
| **Intelligence Package** | 8 | 4 | **+4** | 10 view components exist. Needs a price and a checkout. |
| **Niche Scorecard** | 7 | 4 | **+3** | `src/agents/scorecard.js` exists. Needs the storefront UI. |
| **Analytics Dashboard** | 6 | 3 | **+3** | `AnalyticsPage.jsx` + `supabase/functions/analytics` exist. Needs a premium tier. |
| **Newsletter Signup** | 4 | 2 | **+2** | Component exists. Needs a lead magnet. |
| **Thank-You Calculator Page** | 3 | 2 | **+1** | Exists. Needs to be wired into the funnel. |

### 3.2 High Potential, High Effort (plan carefully)

| Feature | Rev | Effort | Priority | Why |
|---|:--:|:--:|:--:|---|
| **Product Catalog (25 products)** | 8 | 8 | **0** | The catalog is the storefront. 25 `renderBody` functions. |
| **Reputation Command Center** | 6 | 7 | **−1** | Only a 67-LOC edge function exists. Needs a real data source. |
| **Automation Engine** | 7 | 7 | **0** | `automation.*` actions exist. Needs a scheduling layer. |
| **Notion Architect** | 7 | 6 | **+1** | 637 + 446 LOC exist. Needs a UI and a price. |
| **Content Publisher** | 6 | 6 | **0** | Exists. Needs a scheduling layer. |
| **Trends API** | 6 | 6 | **0** | Exists. Needs a UI and a subscription tier. |

### 3.3 Low Potential (deprioritize)

| Feature | Rev | Effort | Priority | Why |
|---|:--:|:--:|:--:|---|
| Model Selector | 2 | 2 | **0** | Internal cost control. |
| Schema Validator | 2 | 2 | **0** | Internal tool. |
| Website Content Store | 2 | 3 | **−1** | `websiteEditor.js` has 0 references. |
| Knowledge Base | 3 | 4 | **−1** | Internal. |
| Vectorize Search | 3 | 5 | **−2** | Orphaned project. |
| Workspace Auditor | 5 | 7 | **−2** | Orphaned project. |

---

## 4. Revenue Paths by Type

### 4.1 SaaS Subscription

| Tier | Features | Price | Status |
|---|---|---|---|
| **Starter** | Quiz, Scorecard, ROI Calculator (free tier) | $0 | ✅ Exists |
| **Builder** | + Intelligence Package, Analytics, Notion Vault | $47/mo or $297 lifetime | ⚠️ `PremiumGate` exists; no checkout |
| **Empire** | + AI Business Partner, Automation Engine, Content Publisher | $197/mo or $997 lifetime | ⚠️ `PremiumGate` exists; no checkout |

**Gap:** `PremiumGate.jsx` verifies a Gumroad license key. There is **no checkout flow** that issues one. The `buyUrl` falls back to `mergedConfig.contact.gumroadUrl` — a single Gumroad product URL, not a tiered ladder.

### 4.2 Digital Products

25 declared. 0 with UI. The 9 LIVE products are the immediate opportunity.

### 4.3 Lead Magnets

| Magnet | Status |
|---|---|
| Digital Superpower Quiz | ✅ Live edge function; ❌ no storefront UI |
| Niche Profitability Scorecard | ⚠️ Backend exists; ❌ no storefront UI |
| 10x ROI Calculator | ⚠️ Dashboard component exists; ❌ no storefront UI |
| Retirement Gap Calculator | ⚠️ Exists in `digitallydefined-online-local` (deleted); ❌ not in the storefront |

### 4.4 Affiliate Opportunities

| Opportunity | Status |
|---|---|
| Affiliate Flip Calculator | ⚠️ 425-LOC HTML exists; ❌ not in storefront |
| Rank & Rent Analyzer | ⚠️ FastAPI router exists; ❌ FastAPI is broken |
| Sellable Marketplace | ⚠️ `supabase/functions/sellable` exists; ❌ no storefront |

### 4.5 Agency Services

| Service | Status |
|---|---|
| Notion Architect (DB design) | ⚠️ 637 + 446 LOC; ❌ no UI, no price |
| Product Generator | ⚠️ FastAPI router; ❌ FastAPI is broken |
| Workspace Auditor | ❌ Orphaned (`os-workers`) |
| Content Repurposer | ❌ Unmigrated (`workspace/buzz-agents`) |

### 4.6 Upsells

| Upsell | Status |
|---|---|
| Free quiz → paid roadmap | ⚠️ `quiz-roadmap` edge function exists |
| Free scorecard → Pro tier | ⚠️ Backend exists |
| Free ROI snapshot → full report | ⚠️ `RoiCalculator.jsx` has `fullModeFields` |
| Free analytics → premium analytics | ⚠️ `AnalyticsPage.jsx` exists |

---

## 5. The Five Revenue Wins

### Win 1: Fix FastAPI (effort: hours)

**Revenue unlocked:** 11 routers, including `wealth`, `niche`, `rankrent`, `affiliate`.

**Action:** rename `fastapi/app/config.py` → `fastapi/app/config_settings.py`, or add `settings` to `fastapi/app/config/__init__.py`.

**Why first:** it is the cheapest change with the largest surface area. One import fix makes 11 productized tools reachable.

### Win 2: Extract licensing from `hermes/index.ts` (effort: days)

**Revenue protected:** all premium access.

**Action:** move `license.verify` into `services/licensing/`. The 1,709-LOC `hermes` function is a single point of failure for every paid feature.

**Why second:** the highest-revenue features are behind a gate implemented inside the largest, most complex function in the codebase.

### Win 3: Give 3 products a `renderBody` (effort: days)

**Revenue unlocked:** the storefront.

**Action:** wire `renderBody` for `digital-superpower-quiz`, `niche-profitability-scorecard`, and `tenx-roi-calculator`. All three have working backend logic today.

**Why third:** the shell is built. Three products prove the pattern. The remaining 22 follow the same shape.

### Win 4: Add a checkout ladder (effort: days)

**Revenue unlocked:** subscriptions.

**Action:** replace the single `buyUrl` in `PremiumGate.jsx` with a tiered ladder (Starter / Builder / Empire). Each tier maps to a Gumroad product.

**Why fourth:** `PremiumGate` is the gate. Without a ladder, there is nothing to buy.

### Win 5: Replace hardcoded metrics with live data (effort: days)

**Revenue protected:** trust.

**Action:** wire `config.js` `metrics` to the `dashboard` action response. The backend already computes real metrics (`fetchBrevoStats`, `fetchFacebookGroup`, `fetchSheetsData`, `fetchNotionSnapshot`).

**Why fifth:** a dashboard showing 1,284 active leads when GA4 shows 57 sessions will not convert.

---

## 6. Revenue Scorecard

| Category | Features | Total Revenue Potential | Total Effort | Net |
|---|---|:--:|:--:|:--:|
| Dashboard | 11 | 57 | 27 | **+30** |
| Backend | 19 | 103 | 88 | **+15** |
| digital-products | 5 | 33 | 9 | **+24** |
| os-workers | 5 | 23 | 31 | **−8** |
| **Total** | **40** | **216** | **155** | **+61** |

**The dashboard and storefront carry the highest net revenue potential.** The backend has the most features but the highest effort. The orphaned `os-workers` is net negative — it should be connected or retired before further investment.

---

## 7. What Not to Build

| Candidate | Why not |
|---|---|
| More agents in `os-workers` | Orphaned project. Connect or retire first. |
| More FastAPI routers | The layer is unreachable. Fix the import before adding routes. |
| More dashboard tabs | `DashboardPage.jsx` is already 1,526 LOC with 13 tabs. |
| White-label system expansion | `configMerge.js` + `customer-config.js` exist with no customers. |
| More Supabase edge functions | 13 exist. Consolidate before adding. |
| More pricing tiers | Pricing has no source of truth. Fix that first. |
