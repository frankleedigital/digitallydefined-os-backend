# DIGITALLYDEFINED_MONEY_MACHINE.md

**Generated:** 2026-10-19
**Companion to:** `CODEBASE_AUDIT.md`, `REVENUE_ENGINE_REPORT.md`
**Perspective:** SaaS founder. Every module is examined for free tier, premium tier, subscription, lead generation, affiliate, and automation opportunities.

---

## 0. The Current Revenue State

**What exists today:**

| Asset | Status |
|---|---|
| Gumroad product | "Digital Business OS – The All-In-One Dashboard for Gen X Women" — $27 |
| Gumroad URL | `https://francescaonline.gumroad.com/l/digital-business-os` |
| Dashboard | Live at `dashboard.digitallydefined.agency` |
| Storefront | `digital-products` — 25 products declared, **0 with UI** |
| Backend | 39 actions, 13 edge functions, 11 FastAPI routers (**unreachable**) |
| Email | Brevo list (live), Mailchimp (dead), SendGrid (dead) |
| Notion | 8 databases (live) |
| Licensing | Gumroad license verification (live) |

**What is missing:**

| Gap | Impact |
|---|---|
| No checkout ladder | `PremiumGate.jsx` verifies a license but there is no tiered purchase flow |
| No product UI | 25 products, 0 `renderBody` |
| No subscription billing | Gumroad is one-time; no recurring revenue |
| No lead magnet delivery | Quiz exists but no storefront UI |
| No affiliate program | Affiliate calculator exists but no program |
| No automation scheduling | Automation actions exist but no scheduler |

**The core insight:** DigitallyDefined has **built the entire revenue infrastructure** — licensing, gating, a 25-product catalog, 11 backend tools, 8 Notion databases — **and connected almost none of it to a purchase flow.**

---

## 1. Module-by-Module Revenue Model

### 1.1 Quiz → Roadmap Funnel

**The asset:** `supabase/functions/quiz-submit` (89 LOC) + `quiz-roadmap` (18 LOC) + `src/agents/quiz.js`. Live.

| Layer | Model | Price | Status |
|---|---|---|---|
| **Free** | 7-question quiz → superpower profile | $0 | ✅ Backend live |
| **Premium** | Personalized roadmap report | $27–47 | ⚠️ Backend exists, no checkout |
| **Subscription** | Monthly roadmap refresh | $9–19/mo | ❌ Not built |
| **Lead gen** | Email capture at quiz start | — | ⚠️ `subscribe` action exists |
| **Affiliate** | Roadmap template affiliate program | — | ❌ Not built |
| **Automation** | Drip sequence post-quiz | — | ⚠️ `followup` edge function exists |

**Quick win:** the quiz is the highest-leverage asset. It is the entry point for the entire funnel. It needs a storefront UI and a $27 roadmap checkout.

### 1.2 Niche Profitability Scorecard

**The asset:** `src/agents/scorecard.js`, `fastapi/app/routers/niche.py` (unreachable), `src/routes/niche.js` (orphaned).

| Layer | Model | Price | Status |
|---|---|---|---|
| **Free** | 6-criteria niche score | $0 | ⚠️ Backend exists |
| **Premium** | Full 6-dimension report + AI interpretation | $9–19/mo | ❌ Not built |
| **Subscription** | Monthly niche monitoring | $19/mo | ❌ Not built |
| **Lead gen** | Score → email capture | — | ❌ Not built |
| **Affiliate** | Niche database affiliate | — | ❌ Not built |

**Quick win:** the scorecard is a natural second step after the quiz. "You're a Builder — now validate your niche."

### 1.3 10x ROI Calculator

**The asset:** `dashboard/src/components/RoiCalculator.jsx` (368 LOC) + `dashboard/public/10x-roi-calculator.html` (422 LOC) + `dashboard/src/pages/ThankYouCalculatorPage.jsx` (219 LOC).

| Layer | Model | Price | Status |
|---|---|---|---|
| **Free** | ROI snapshot | $0 | ✅ Component exists |
| **Premium** | Full report | $27–47 | ⚠️ `fullModeFields` exists |
| **Subscription** | — | — | — |
| **Lead gen** | Email capture for full report | — | ⚠️ Thank-you page exists |
| **Affiliate** | — | — | — |

**Quick win:** the calculator already has `fullModeFields` (retention months, etc.) — the free/paid split is designed. It needs a price and a checkout.

### 1.4 Intelligence Package

**The asset:** `dashboard/src/components/intelligence/` (10 view components) + `dashboard/src/pages/IntelligencePage.jsx` + `os-backend/src/workflows/intelligencePipeline.js`.

| Layer | Model | Price | Status |
|---|---|---|---|
| **Free** | Superpower profile | $0 | ✅ Exists |
| **Premium** | 10-view intelligence report | $49–99 | ⚠️ `PremiumGate` wraps it |
| **Subscription** | Monthly intelligence refresh | $19/mo | ❌ Not built |
| **Lead gen** | Quiz → intelligence | — | ✅ Funnel exists |
| **Affiliate** | — | — | — |

**Quick win:** `PremiumGate` already wraps `IntelligencePage`. It needs a checkout ladder.

### 1.5 AI Business Partner

**The asset:** `dashboard/src/pages/AssistantPage.jsx` (323 LOC) + `PremiumGate.jsx` + `lib/premium.js` + `supabase/functions/hermes` (`chat` action).

| Layer | Model | Price | Status |
|---|---|---|---|
| **Free** | — | — | — |
| **Premium** | Unlimited AI business partner | $29–99/mo | ⚠️ `PremiumGate` wraps it |
| **Subscription** | — | — | — |
| **Lead gen** | — | — | — |
| **Automation** | Proactive mentoring | — | ⚠️ `mentor.dev` action exists |

**Quick win:** highest revenue potential ($29–99/mo). Already gated. Needs a checkout ladder.

### 1.6 Digital Business OS (Notion)

**The asset:** `dashboard/src/pages/NotionTab.jsx` (303 LOC) + `lib/notion.js` + `lib/notionArchitect.js` (265 LOC) + 8 Notion databases.

| Layer | Model | Price | Status |
|---|---|---|---|
| **Free** | — | — | — |
| **Premium** | 8-database Notion workspace | $97–197 | ✅ **Already selling on Gumroad at $27** |
| **Subscription** | Monthly OS updates | $19–39/mo | ❌ Not built |
| **Affiliate** | Notion template affiliates | — | ❌ Not built |

**Note:** the Gumroad product is priced at **$27** but `products.js` says **$97–197**. **Price inconsistency.** See `CODEBASE_AUDIT.md` §8.3.

### 1.7 Wealth Calculator

**The asset:** `fastapi/app/routers/wealth.py` + `services/wealth_service.py` + `models/wealth.py`. **Unreachable.**

| Layer | Model | Price | Status |
|---|---|---|---|
| **Free** | Retirement gap calculation | $0 | ❌ FastAPI broken |
| **Premium** | Full wealth plan | $27–47 | ❌ Not built |
| **Subscription** | — | — | — |

**Quick win:** fix FastAPI → the router is already written.

### 1.8 Reputation Command Center

**The asset:** `supabase/functions/reputation` (67 LOC) + `dashboard/src/config.js` (hardcoded metrics).

| Layer | Model | Price | Status |
|---|---|---|---|
| **Free** | Sentiment snapshot | $0 | ⚠️ Hardcoded data |
| **Premium** | Full reputation dashboard | $19–29/mo | ❌ Not built |
| **Subscription** | Monthly reputation monitoring | $29/mo | ❌ Not built |
| **Automation** | Review alerts | — | ❌ Not built |

**Blocker:** the dashboard shows **hardcoded metrics** (`communityCount: "1,284"`, `activeLeads: "1,284"`). A customer who checks GA4 will not trust it.

### 1.9 Affiliate Center

**The asset:** `fastapi/app/routers/affiliate.py` + `dashboard/public/affiliate-flip-calculator.html` (425 LOC) + `dashboard/src/lib/affiliateExport.js`.

| Layer | Model | Price | Status |
|---|---|---|---|
| **Free** | Affiliate flip calculator | $0 | ⚠️ HTML exists |
| **Premium** | Full flip analysis | $27–47 | ❌ Not built |
| **Affiliate** | Affiliate program for the calculator itself | — | ❌ Not built |

**Opportunity:** the affiliate calculator is a natural affiliate offer. "Use this tool, earn a commission."

### 1.10 Product Library

**The asset:** `digital-products/src/lib/products.js` (25 entries) + `fastapi/app/data/products.py` (394 LOC).

| Layer | Model | Price | Status |
|---|---|---|---|
| **Free** | Product catalog access | $0 | ✅ Exists |
| **Premium** | — | — | — |
| **Subscription** | — | — | — |

**Blocker:** 0 of 25 products have a UI.

### 1.11 Agency Portal

**The asset:** `dashboard/src/configMerge.js` (134 LOC) + `dashboard/public/customer-config.js` (191 LOC) + `dashboard/src/brand/`.

| Layer | Model | Price | Status |
|---|---|---|---|
| **Free** | — | — | — |
| **Premium** | White-label dashboard | $197–497/mo | ❌ No customers |
| **Agency** | Done-for-you setup | $997+ | ❌ Not built |

**Opportunity:** the white-label system is fully built. It is the highest-price asset in the ecosystem and has zero customers.

### 1.12 Automation Engine

**The asset:** `api/index.js` (`automation.*`) + `supabase/functions/followup` (106) + `post-publisher` (109) + `optimization-loop` (83) + `optimization-loop-weekly` (61).

| Layer | Model | Price | Status |
|---|---|---|---|
| **Free** | — | — | — |
| **Premium** | Automation suite | $19–39/mo | ❌ Not built |
| **Subscription** | — | — | — |
| **Automation** | Content publishing | — | ✅ Live |

**Opportunity:** the automation infrastructure is live and running. It is not packaged as a product.

### 1.13 Content Publisher

**The asset:** `supabase/functions/post-publisher` (109) + `_shared/social-publishers.ts` (368) + 5 platform publishers.

| Layer | Model | Price | Status |
|---|---|---|---|
| **Free** | — | — | — |
| **Premium** | Social publishing suite | $19–39/mo | ❌ Not built |
| **Agency** | Done-for-you social | $297/mo | ❌ Not built |

### 1.14 Analytics Dashboard

**The asset:** `dashboard/src/pages/AnalyticsPage.jsx` (221 LOC) + `lib/analytics.js` + `supabase/functions/analytics` (550 LOC).

| Layer | Model | Price | Status |
|---|---|---|---|
| **Free** | — | — | — |
| **Premium** | Live analytics | $9–19/mo | ⚠️ Exists, not gated |
| **Subscription** | — | — | — |

### 1.15 Notion Vault Sync

**The asset:** `dashboard/src/pages/NotionTab.jsx` (303 LOC) + 8 Notion databases.

| Layer | Model | Price | Status |
|---|---|---|---|
| **Free** | — | — | — |
| **Premium** | Vault sync | $9–19/mo | ⚠️ Exists, not gated |
| **Subscription** | — | — | — |

### 1.16 os-workers (Orphaned)

**The asset:** 4,837 LOC, 6 agents, 3 workflows, Vectorize search.

| Layer | Model | Price | Status |
|---|---|---|---|
| **Agency** | Done-for-you Notion build | $997+ | ❌ Orphaned |
| **Subscription** | Template library access | $19/mo | ❌ Orphaned |

**Recommendation:** connect or retire. Do not invest further until the decision is made.

---

## 2. Quick Revenue Wins

### Win 1: Fix FastAPI — unlock 11 tools (hours)

**Revenue:** `wealth`, `niche`, `rankrent`, `affiliate`, `domain`, `offerarchitect`, `assetplan`, `blueprint`, `product`, `roadmap`, `trends`.

**Action:** rename `fastapi/app/config.py` → `config_settings.py`, or add `settings` to `config/__init__.py`.

**Why first:** cheapest change, largest surface.

### Win 2: Extract licensing from `hermes/index.ts` (days)

**Revenue protected:** all premium access.

**Action:** move `license.verify` into `services/licensing/`.

**Why second:** the highest-revenue features are gated by a function inside the largest, most complex file in the codebase.

### Win 3: Add a checkout ladder (days)

**Revenue unlocked:** subscriptions.

**Action:** replace `PremiumGate.jsx`'s single `buyUrl` with a tiered ladder.

**Why third:** the gate exists; the ladder does not.

### Win 4: Give 3 products a `renderBody` (days)

**Revenue unlocked:** the storefront.

**Action:** wire `renderBody` for `digital-superpower-quiz`, `niche-profitability-scorecard`, `tenx-roi-calculator`.

**Why fourth:** the shell is built. Three products prove the pattern.

### Win 5: Replace hardcoded metrics with live data (days)

**Revenue protected:** trust.

**Action:** wire `config.js` `metrics` to the `dashboard` action response.

**Why fifth:** a dashboard showing 1,284 leads when GA4 shows 57 will not convert.

### Win 6: Fix the price inconsistency (hours)

**Revenue protected:** conversion.

**Action:** reconcile `$27` (Gumroad) vs `$97–197` (`products.js`) for the Digital Business OS.

**Why sixth:** a customer seeing two prices will not buy either.

---

## 3. 30-Day Revenue Plan

### Week 1: Unblock

| Day | Task | Outcome |
|---|---|---|
| 1 | Fix FastAPI `config` collision | 11 tools reachable |
| 2 | Add caching to `fetchNotionSnapshot`, `fetchFacebookGroup`, `fetchSheetsData` | Dashboard load 4 upstream calls → 0 |
| 3 | Extract `license.verify` into `services/licensing` | Premium gate isolated |
| 4 | Fix `x-forwarded-for` trust | Rate limiter secure |
| 5 | Add auth gate to `/dashboard` | Bot traffic shed |

### Week 2: Package

| Day | Task | Outcome |
|---|---|---|
| 6 | Create the pricing ladder (Starter / Builder / Empire) | 3 tiers defined |
| 7 | Wire `PremiumGate` to the ladder | Checkout flow exists |
| 8 | Create 3 Gumroad products (Builder $47, Empire $197, Roadmap $27) | Products live |
| 9 | Reconcile the Digital Business OS price | One price everywhere |
| 10 | Write the roadmap checkout | $27 product live |

### Week 3: Ship

| Day | Task | Outcome |
|---|---|---|
| 11 | Wire `renderBody` for the quiz | Quiz product live |
| 12 | Wire `renderBody` for the scorecard | Scorecard product live |
| 13 | Wire `renderBody` for the ROI calculator | ROI product live |
| 14 | Test the full funnel: quiz → roadmap → checkout | End-to-end works |
| 15 | Test the premium gate: free → Builder → Empire | Upgrade path works |

### Week 4: Optimize

| Day | Task | Outcome |
|---|---|---|
| 16 | Replace hardcoded metrics with live data | Trust restored |
| 17 | Add email capture to the quiz | Lead gen live |
| 18 | Wire the `followup` drip sequence | Nurture live |
| 19 | Add the affiliate flip calculator to the storefront | Affiliate opportunity live |
| 20 | Add the wealth calculator to the storefront | 4th product live |
| 21 | Add the niche scorecard Pro tier | Subscription live |
| 22 | Add the intelligence package checkout | $49–99 product live |
| 23 | Add the AI Business Partner checkout | $29–99/mo live |
| 24 | Add the analytics premium tier | $9–19/mo live |
| 25 | Add the Notion Vault premium tier | $9–19/mo live |
| 26 | Add the automation suite tier | $19–39/mo live |
| 27 | Add the content publisher tier | $19–39/mo live |
| 28 | Add the reputation monitoring tier | $29/mo live |
| 29 | Full funnel test + analytics verification | All tiers live |
| 30 | Review and document | Playbook complete |

**30-day target:** 8 products live, 3 subscription tiers, 1 affiliate opportunity, 1 lead magnet.

---

## 4. 90-Day Revenue Plan

### Month 1: Foundation (days 1–30)

Complete the 30-day plan. **Target: first revenue.**

### Month 2: Expand (days 31–60)

| Week | Task | Outcome |
|---|---|---|
| 5 | Wire `renderBody` for the remaining 6 LIVE products | 9 LIVE products live |
| 6 | Build the remaining 12 BACKEND product UIs | 21 products live |
| 7 | Build the 4 PLACEHOLDER product UIs | 25 products live |
| 8 | Add the agency portal (white-label) | $197–497/mo tier live |

### Month 3: Scale (days 61–90)

| Week | Task | Outcome |
|---|---|---|
| 9 | Connect or retire `os-workers` | 4,837 LOC resolved |
| 10 | Add the affiliate program | Affiliate revenue live |
| 11 | Add the automation scheduling layer | Automation revenue live |
| 12 | Add the Vectorize template library | Subscription revenue live |

**90-day target:** 25 products live, 5 subscription tiers, 1 affiliate program, 1 agency tier, 1 automation product.

---

## 5. Revenue Model Summary

### 5.1 The Ladder

| Tier | Price | Features | Target |
|---|---|---|---|
| **Starter** | $0 | Quiz, Scorecard, ROI snapshot | Lead generation |
| **Builder** | $47/mo or $297 lifetime | + Intelligence, Analytics, Notion Vault, Roadmap | Core offer |
| **Empire** | $197/mo or $997 lifetime | + AI Business Partner, Automation, Content Publisher, Reputation | High-ticket |
| **Agency** | $497/mo or $1,997 lifetime | + White-label, done-for-you setup | Premium |

### 5.2 The Funnel

```
Quiz (free)
  → Superpower profile (free)
    → Roadmap report ($27)
      → Intelligence package ($49–99)
        → Builder subscription ($47/mo)
          → Empire subscription ($197/mo)
            → Agency ($497/mo)
```

### 5.3 The Revenue Mix

| Source | Target % | Notes |
|---|---|---|
| Subscriptions (Builder + Empire) | 50% | Recurring |
| One-time products (Roadmap, Intelligence) | 25% | Gumroad |
| Agency | 15% | High-ticket |
| Affiliate | 10% | Passive |

### 5.4 The Automation Layer

| Automation | Status |
|---|---|
| Quiz → email capture | ⚠️ `subscribe` action exists |
| Quiz → drip sequence | ⚠️ `followup` edge function exists |
| Content publishing | ✅ Live |
| Optimization loop | ✅ Live (weekly) |
| Reputation alerts | ❌ Not built |
| Niche monitoring | ❌ Not built |
| Roadmap refresh | ❌ Not built |

---

## 6. What Not to Monetize Yet

| Module | Why not |
|---|---|
| Model Selector | Internal cost control. |
| Schema Validator | Internal tool. |
| Website Content Store | `websiteEditor.js` has 0 references. |
| Knowledge Base | Internal. |
| Vectorize Search | Orphaned project. |
| Workspace Auditor | Orphaned project. |
| White-label expansion | No customers. Fix the ladder first. |

---

## 7. The One Sentence

**DigitallyDefined has built a complete revenue infrastructure — licensing, gating, a 25-product catalog, 11 backend tools, 8 Notion databases, 5 social publishers — and connected almost none of it to a purchase flow. The next 30 days should be spent connecting what exists, not building what does not.**
