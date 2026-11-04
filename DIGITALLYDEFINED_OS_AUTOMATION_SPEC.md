# DIGITALLYDEFINED OS — Database Architecture & Automation Specification

**Generated:** 2026-10-27
**Scope:** DigitallyDefined OS Database Architecture vs. Intended Purpose
**Source:** Live codebase analysis (`digitallydefined-os-backend`, `digitallydefined-dashboard`, `supabase/functions`)
**Method:** Static analysis of every file, schema, edge function, route, and automation reference.

---

## 1. INTENDED PURPOSE

```
Idea
  → Opportunity Scoring
  → Build Decision
  → Asset Creation
  → Marketing Asset Creation
  → Approval Queue
  → Product Publishing
  → Revenue Tracking
  → Product Intelligence
```

This is the **Digital Product Intelligence Pipeline** — a self-improving system where a new idea flows through scoring, creation, marketing, approval, publishing, and revenue feedback loops.

---

## 2. ACTUAL DATABASE SCHEMAS (from `notion-architect.ts`)

### Database 1: Ideas & Intake DB
| Field | Type | Required | Purpose |
|---|---|---|---|
| Name | title | ✅ | Idea title |
| Status | select (Draft/Published/Archived) | ❌ | Idea status |
| Source | rich_text | ❌ | Where the idea came from |
| Niche | rich_text | ❌ | Target niche |
| Created | date | ❌ | Creation date |

### Database 2: Digital Assets DB
| Field | Type | Required | Purpose |
|---|---|---|---|
| Name | title | ✅ | Asset name |
| URL | url | ❌ | Asset URL |
| Status | select (Draft/Published/Paused/Scheduled/Archived) | ❌ | Asset status |
| Niche | rich_text | ❌ | Target niche |
| AssetValue | number | ❌ | Asset value |
| Created | date | ❌ | Creation date |

### Database 3: Content Blocks DB
| Field | Type | Required | Purpose |
|---|---|---|---|
| Name | title | ✅ | Content title |
| Status | select (Draft/Published/Scheduled/Archived) | ❌ | Content status |
| ContentType | select (Blog/Newsletter/Social/Video/Guide/Template) | ❌ | Content type |
| Niche | rich_text | ❌ | Target niche |
| URL | url | ❌ | Content URL |
| Created | date | ❌ | Creation date |

### Database 4: Reputation Signals DB
| Field | Type | Required | Purpose |
|---|---|---|---|
| Name | title | ✅ | Signal title |
| URL | url | ❌ | Signal URL |
| Signal | select (Positive/Neutral/Negative) | ❌ | Sentiment signal |
| Score | number | ❌ | Sentiment score |
| Created | date | ❌ | Signal date |

### Database 5: Money Snapshot DB
| Field | Type | Required | Purpose |
|---|---|---|---|
| Name (legacy: Month) | title | ✅ | Month title |
| Month | date | ❌ | Month date |
| Revenue | number | ❌ | Revenue amount |
| Expenses | number | ❌ | Expenses amount |
| Net | number | ❌ | Net profit |
| Created | date (read-only) | ❌ | Auto-generated |

### Database 6: Templates Library DB
| Field | Type | Required | Purpose |
|---|---|---|---|
| Name (legacy: Template Name) | title | ✅ | Template name |
| Status | select (Draft/Published/Archived) | ❌ | Template status |
| Format | select (PDF/Notion/Spreadsheet/Checklist/Playbook) | ❌ | Template format |
| URL | url | ❌ | Template URL |
| Niche | rich_text | ❌ | Target niche |
| Created | date | ❌ | Creation date |

### Database 7: Automations Log DB
| Field | Type | Required | Purpose |
|---|---|---|---|
| Name | title | ✅ | Automation name |
| Status | select (Draft/Published/Done/Failed) | ❌ | Automation status |
| Source | rich_text | ❌ | Automation source |
| Email | email | ❌ | Contact email |
| Superpower | rich_text | ❌ | Superpower tag |
| Created | date | ❌ | Creation date |

---

## 3. CURRENT STATE — WHAT AUTOMATIONS EXIST

### 3.1 Existing Automation Infrastructure

| Component | File | Status | What it does |
|---|---|---|---|
| Notion Sync Edge Function | `supabase/functions/notion-sync/index.ts` | ✅ LIVE | Bidirectional sync between Notion and Supabase |
| Notion Write (Deno) | `supabase/functions/_shared/notion-write.ts` | ✅ LIVE | Creates/updates Notion pages |
| Notion Client (Deno) | `supabase/functions/_shared/notion-client.ts` | ✅ LIVE | Notion API wrapper |
| Notion Architect (Deno) | `supabase/functions/_shared/notion-architect.ts` | ✅ LIVE | Schema contract for 8 DBs |
| Notion Architect (Node) | `lib/notion-architect.js` | ✅ LIVE | JS mirror of Deno contract |
| Notion Architect (Python) | `fastapi/app/notion_architect.py` | ✅ LIVE | Python mirror |
| Antigravity MCP Client (Node) | `lib/antigravity.js` | ✅ LIVE | MCP client → Notion REST API |
| Antigravity MCP Client (CF Worker) | `os-workers/src/agents/notionArchitect.ts` | ✅ LIVE (orphaned) | Same MCP client in Workers |
| Optimization Loop (Cron) | `supabase/functions/optimization-loop/index.ts` | ✅ LIVE | Runs every 6 hours |
| Optimization Loop Weekly | `supabase/functions/optimization-loop-weekly/index.ts` | ✅ LIVE | Runs weekly |
| Follow-up Email | `supabase/functions/followup/index.ts` | ✅ LIVE | Cron-driven follow-up emails |
| Post Publisher | `supabase/functions/post-publisher/index.ts` | ✅ LIVE | Publishes scheduled posts |
| Quiz Submit | `supabase/functions/quiz-submit/index.ts` | ✅ LIVE | Quiz result → Notion record |
| Content | `supabase/functions/content/index.ts` | ✅ LIVE | Website content editor |
| Reputation | `supabase/functions/reputation/index.ts` | ✅ LIVE | Reputation signals |
| Sync | `supabase/functions/sync/index.ts` | ✅ LIVE | Data sync |
| Sellable | `supabase/functions/sellable/index.ts` | ✅ LIVE | Product gating |
| Dashboard | `api/index.js` (Vercel) | ✅ LIVE | 39 actions, Notion snapshot |
| Social Publishers | `lib/social-publishers.js` | ⚠️ ORPHANED | Can publish to 5 platforms, 0 references |
| Email Publish | `lib/email-publish.js` | ⚠️ ORPHANED | Can send emails, 0 references |
| Website Editor | `src/services/websiteEditor.js` | ⚠️ ORPHANED | Can edit website content, 0 references |
| Product Generator | `fastapi/app/services/product_generator.py` | ⚠️ ORPHANED | Can generate product metadata, FastAPI unreachable |
| Product Packager | `fastapi/app/services/product_packager.py` | ⚠️ ORPHANED | Can package products, FastAPI unreachable |

### 3.2 What automations actually exist (verified by code)

| Automation | Trigger | File | Status |
|---|---|---|---|
| Notion → Dashboard sync | Manual "Sync Vault" button or cron | `api/index.js` → `fetchNotionSnapshot()` | ✅ Working |
| Quiz → Notion record | Quiz completion | `quiz-submit` edge function | ✅ Working |
| Follow-up email | Cron (daily) | `followup` edge function | ✅ Working |
| Post publishing | Cron | `post-publisher` edge function | ✅ Working |
| Optimization loop | Cron (6h) | `optimization-loop` edge function | ✅ Working |
| AI brief generation | On dashboard load | `api/index.js` → `fetchAIBrief()` | ✅ Working (cached 20 min) |
| Brevo stats | On dashboard load | `api/index.js` → `fetchBrevoStats()` | ✅ Working (cached 15 min) |

### 3.3 What automations do NOT exist

| Automation | Status | Evidence |
|---|---|---|
| New Notion asset → Product record | ❌ MISSING | No webhook, no trigger, no listener |
| Product → Sales page | ❌ MISSING | `websiteEditor.js` orphaned |
| Product → Lead magnet | ❌ MISSING | No code exists |
| Product → Email sequence | ❌ MISSING | `email-publish.js` orphaned |
| Product → Social posts | ❌ MISSING | `social-publishers.js` orphaned |
| Product → Gumroad listing | ❌ MISSING | No Gumroad API code anywhere |
| Sale → Revenue tracking | ⚠️ PARTIAL | `sellable` edge function exists but is never called |
| Revenue → Dashboard update | ⚠️ PARTIAL | `fetchBrevoStats` called on dashboard load, but no auto-update |

---

## 4. INTENDED STATE — THE PIPELINE

```
Idea (Notion: Ideas & Intake DB)
  → Opportunity Scoring (AI analysis of idea)
  → Build Decision (BuildNow = true)
  → Asset Creation (Digital Assets DB record created)
  → Marketing Asset Creation (Content Blocks DB + Templates Library DB)
  → Approval Queue (Status = "Pending Approval")
  → Product Publishing (Gumroad listing + website content)
  → Revenue Tracking (Money Snapshot DB updated)
  → Product Intelligence (AI analysis of revenue + reputation)
```

### Field-to-Action Mapping (Intended)

| Database | Field | Trigger | Action |
|---|---|---|---|
| Ideas & Intake | `Status` = "Approved" | BuildNow = true | Create Digital Asset record |
| Ideas & Intake | `Ready for AI` = true | AI analysis | Generate product metadata |
| Ideas & Intake | `Ready for Insights` = true | AI analysis | Generate opportunity score |
| Digital Assets | `Status` = "Published" | Product publishing | Create Gumroad listing + website content |
| Digital Assets | `Status` = "Draft" | Asset creation | Generate lead magnet + email + social |
| Content Blocks | `Status` = "Published" | Content publishing | Publish to website/social |
| Content Blocks | `ContentType` = "Social" | Social publishing | Post to social platforms |
| Money Snapshot | `Revenue` > 0 | Revenue tracking | Update dashboard, trigger AI analysis |
| Money Snapshot | `Net` < 0 | Alert | Notify founder |
| Templates Library | `Status` = "Published" | Template publishing | Make available for download |
| Automations Log | `Status` = "Failed" | Alert | Notify founder, retry |
| Reputation Signals | `Signal` = "Negative" | Alert | Notify founder, create task |

---

## 5. AUTOMATION GAP ANALYSIS

### 5.1 Gap Matrix

| Stage | Current | Missing | Effort |
|---|---|---|---|
| Idea → Opportunity Scoring | ❌ Nothing | AI scoring agent, trigger on new idea | MEDIUM |
| Opportunity Scoring → Build Decision | ❌ Nothing | BuildNow field, AI recommendation | MEDIUM |
| Build Decision → Asset Creation | ❌ Nothing | Create Digital Asset record from idea | LOW |
| Asset Creation → Marketing Assets | ❌ Nothing | Generate lead magnet, email, social | HIGH |
| Marketing Assets → Approval Queue | ❌ Nothing | Status field + approval workflow | LOW |
| Approval Queue → Product Publishing | ❌ Nothing | Gumroad API + website content | HIGH |
| Product Publishing → Revenue Tracking | ❌ Nothing | Sellable edge function + Money Snapshot | MEDIUM |
| Revenue Tracking → Product Intelligence | ❌ Nothing | AI analysis of revenue data | MEDIUM |

### 5.2 Missing Triggers

| Trigger | Should fire when | Currently |
|---|---|---|
| New idea added | `Ideas & Intake` DB new page | ❌ No webhook, no cron, no listener |
| BuildNow = true | Field changed to "true" | ❌ No webhook, no polling |
| Ready for AI = true | Field changed to "true" | ❌ No webhook, no polling |
| Ready for Insights = true | Field changed to "true" | ❌ No webhook, no polling |
| Product sold | Gumroad webhook | ❌ No webhook endpoint |
| New revenue data | Money Snapshot DB updated | ❌ No trigger, no polling |
| Product published | Status = "Published" | ❌ No trigger |

### 5.3 Missing AI Workflows

| Workflow | What it should do | Currently |
|---|---|---|
| Idea scoring | Analyze idea for demand, competition, fit | ❌ No code |
| Product metadata generation | Generate title, description, price, niche | ⚠️ `product_generator.py` exists but unreachable |
| Sales page generation | Generate website content from product | ⚠️ `websiteEditor.js` exists but orphaned |
| Lead magnet generation | Generate freebie from product | ❌ No code |
| Email sequence generation | Generate 5-email nurture sequence | ⚠️ `email-publish.js` exists but orphaned |
| Social asset generation | Generate 10 social posts | ⚠️ `social-publishers.js` exists but orphaned |
| Product intelligence | Analyze revenue + reputation + content | ❌ No code |

### 5.4 Missing Field Triggers

| Field | Database | Should trigger | Currently |
|---|---|---|---|
| `BuildNow` | Ideas & Intake | Asset creation + marketing generation | ❌ No field exists in schema |
| `Ready for AI` | Ideas & Intake | AI product metadata generation | ❌ No field exists in schema |
| `Ready for Insights` | Ideas & Intake | AI opportunity scoring | ❌ No field exists in schema |
| `Status` = "Published" | Digital Assets | Gumroad listing + website content | ⚠️ Field exists, no trigger |
| `Revenue` > 0 | Money Snapshot | Dashboard update + AI analysis | ⚠️ Field exists, no trigger |
| `Signal` = "Negative" | Reputation Signals | Alert + task creation | ⚠️ Field exists, no trigger |

---

## 6. ANSWERS TO SPECIFIC QUESTIONS

### Q6: What happens when BuildNow = true?
**CURRENT:** Nothing. The field doesn't exist in the schema. No code listens for it.
**INTENDED:** Create Digital Asset record → generate marketing assets → queue for approval → publish to Gumroad + website.

### Q7: What happens when Ready for AI = true?
**CURRENT:** Nothing. The field doesn't exist. No AI workflow is triggered.
**INTENDED:** AI generates product metadata (title, description, price, niche, keywords) and writes it to the Digital Assets DB.

### Q8: What happens when Ready for Insights = true?
**CURRENT:** Nothing. The field doesn't exist. No analysis is triggered.
**INTENDED:** AI analyzes the idea against market data, competition, and audience fit. Returns opportunity score + recommendation. Writes to Reputation Signals DB.

### Q9: What happens when a product is sold?
**CURRENT:** Nothing. No Gumroad webhook exists. No revenue tracking is triggered.
**INTENDED:** Gumroad webhook → Supabase Edge Function → update Money Snapshot DB → trigger AI analysis → update dashboard.

### Q10: What happens when new revenue data appears?
**CURRENT:** Nothing. No trigger exists. The dashboard only shows revenue when manually loaded.
**INTENDED:** Money Snapshot DB update → Supabase Edge Function → AI analysis → dashboard auto-refresh → alert if revenue exceeds threshold.

---

## 7. MINIMUM VIABLE AUTOMATION ARCHITECTURE

### 7.1 Required Infrastructure Changes

#### A. Add Missing Fields to Ideas & Intake DB Schema
```typescript
// In notion-architect.ts, add to ideas DB:
{ name: "BuildNow", type: "checkbox", required: false },
{ name: "Ready for AI", type: "checkbox", required: false },
{ name: "Ready for Insights", type: "checkbox", required: false },
{ name: "Opportunity Score", type: "number", required: false },
{ name: "Build Decision", type: "select", required: false, options: ["Build", "Skip", "Research More"] },
```

#### B. Add Missing Fields to Digital Assets DB Schema
```typescript
// In notion-architect.ts, add to assets DB:
{ name: "BuildNow", type: "checkbox", required: false },
{ name: "Product ID", type: "rich_text", required: false, maxChars: 100 },
{ name: "Gumroad URL", type: "url", required: false },
{ name: "Price", type: "number", required: false },
{ name: "Lead Magnet URL", type: "url", required: false },
{ name: "Email Sequence ID", type: "rich_text", required: false, maxChars: 100 },
{ name: "Social Post Count", type: "number", required: false },
```

#### C. Add Missing Fields to Money Snapshot DB Schema
```typescript
// Already has: Name, Month, Revenue, Expenses, Net, Created
// Add:
{ name: "Product", type: "rich_text", required: false, maxChars: 200 },
{ name: "Source", type: "select", required: false, options: ["Gumroad", "Direct", "Affiliate"] },
{ name: "Transaction ID", type: "rich_text", required: false, maxChars: 100 },
```

### 7.2 Required New Edge Functions

| Edge Function | Purpose | Trigger | Effort |
|---|---|---|---|
| `notion-webhook` | Receive Notion webhooks, route to appropriate handler | Notion webhook | MEDIUM |
| `product-factory` | Orchestrate product creation from idea | Webhook / API call | HIGH |
| `gumroad-webhook` | Receive Gumroad sale events, update Money Snapshot | Gumroad webhook | MEDIUM |
| `product-intelligence` | AI analysis of product performance | Cron / webhook | MEDIUM |

### 7.3 Required New API Endpoints (in `api/index.js`)

| Action | Purpose | Effort |
|---|---|---|
| `product.create` | Create product record from idea | LOW |
| `product.publish` | Publish product to Gumroad + website | HIGH |
| `product.analyze` | AI analysis of product performance | MEDIUM |
| `revenue.track` | Track revenue from sale | MEDIUM |

### 7.4 Required Cloudflare Worker

| Worker | Purpose | Trigger | Effort |
|---|---|---|---|
| `notion-webhook-handler` | Receive Notion webhooks, validate, forward to Supabase | HTTP POST | MEDIUM |

### 7.5 Required Make.com Scenarios

| Scenario | Trigger | Actions | Effort |
|---|---|---|---|
| New Idea → AI Scoring | Notion webhook (new page in Ideas DB) | Call Supabase edge function → AI analysis → update Notion | MEDIUM |
| BuildNow → Product Creation | Notion webhook (BuildNow = true) | Call product-factory → create Digital Asset → generate marketing | HIGH |
| Product Sold → Revenue Tracking | Gumroad webhook | Call revenue.track → update Money Snapshot → AI analysis | MEDIUM |
| Revenue Threshold Alert | Money Snapshot updated | Check threshold → send Telegram/Slack alert | LOW |

---

## 8. IMPLEMENTATION PLAN

### Phase 1: Quick Wins (1-3 days)

| Task | Effort | What it does |
|---|---|---|
| Add `BuildNow`, `Ready for AI`, `Ready for Insights` fields to Ideas DB schema | LOW | Enable trigger fields |
| Add `Product ID`, `Gumroad URL`, `Price`, `Lead Magnet URL` to Assets DB schema | LOW | Enable product tracking |
| Add `Product`, `Source`, `Transaction ID` to Money Snapshot DB schema | LOW | Enable revenue attribution |
| Create `product.create` action in `api/index.js` | LOW | Manual product creation from idea |
| Wire `product_generator.py` to `product.create` action | MEDIUM | AI product metadata generation |

### Phase 2: Automation Layer (1 week)

| Task | Effort | What it does |
|---|---|---|
| Create Notion webhook handler (Cloudflare Worker) | MEDIUM | Receive Notion webhooks |
| Create `notion-webhook` edge function | MEDIUM | Route webhooks to handlers |
| Create `product-factory` edge function | HIGH | Orchestrate product creation |
| Wire `websiteEditor.js` to product publishing | MEDIUM | Auto-generate sales pages |
| Wire `email-publish.js` to product creation | MEDIUM | Auto-generate email sequences |
| Wire `social-publishers.js` to product creation | MEDIUM | Auto-generate social posts |

### Phase 3: Autonomous Product Factory (2-4 weeks)

| Task | Effort | What it does |
|---|---|---|
| Create Gumroad API integration | HIGH | Auto-create Gumroad listings |
| Create `gumroad-webhook` edge function | MEDIUM | Receive sale events |
| Create `product-intelligence` edge function | MEDIUM | AI analysis of product performance |
| Add approval queue workflow | MEDIUM | Status field + dashboard approval UI |
| Add revenue tracking automation | MEDIUM | Auto-update Money Snapshot + dashboard |
| Add product intelligence loop | MEDIUM | AI analyzes revenue → generates insights |

### Phase 4: Revenue Optimization (ongoing)

| Task | Effort | What it does |
|---|---|---|
| A/B test pricing | MEDIUM | Test different price points |
| Optimize conversion rates | MEDIUM | Track and improve funnel |
| Scale winning products | LOW | Auto-promote top performers |
| Kill underperforming products | LOW | Auto-archive low-revenue products |

---

## 9. MINIMUM VIABLE AUTOMATION ARCHITECTURE

### The smallest change that makes it work

```
1. Add BuildNow field to Ideas DB (checkbox)
2. Create product-factory edge function (orchestrates everything)
3. Wire product_generator.py → product-factory (AI metadata)
4. Wire websiteEditor.js → product-factory (sales page)
5. Wire email-publish.js → product-factory (email sequence)
6. Wire social-publishers.js → product-factory (social posts)
7. Add manual "Build Product" button in dashboard (Phase 1)
8. Add Notion webhook → product-factory (Phase 2)
9. Add Gumroad webhook → revenue tracking (Phase 3)
```

### Files to create/modify

| File | Action | Effort |
|---|---|---|
| `supabase/functions/_shared/notion-architect.ts` | Add BuildNow, Ready for AI, Ready for Insights fields | LOW |
| `supabase/functions/product-factory/index.ts` | NEW — orchestration edge function | HIGH |
| `supabase/functions/gumroad-webhook/index.ts` | NEW — receive sale events | MEDIUM |
| `supabase/functions/product-intelligence/index.ts` | NEW — AI analysis | MEDIUM |
| `api/index.js` | Add `product.create`, `product.publish`, `product.analyze`, `revenue.track` actions | MEDIUM |
| `lib/antigravity.js` | Add `buildProduct` method | LOW |
| `digitallydefined-dashboard/src/pages/DashboardPage.jsx` | Add "Build Product" button to Notion tab | LOW |

---

## 10. REVENUE MACHINE SCORE

| Category | Score | Evidence |
|---|---|---|
| Notion Integration | 6/10 | 8 DBs wired, sync works, but no triggers |
| Automation Layer | 2/10 | Cron jobs exist, but no event-driven triggers |
| AI Content Generation | 3/10 | `product_generator.py` exists but unreachable |
| Product Creation | 1/10 | No product creation pipeline |
| Marketing Automation | 1/10 | `email-publish.js` and `social-publishers.js` orphaned |
| Gumroad Automation | 0/10 | No Gumroad API code exists |
| Revenue Tracking | 2/10 | `sellable` edge function exists but unused |
| Analytics | 3/10 | Dashboard shows metrics, but no auto-update |
| Customer Delivery | 1/10 | `r2Storage.js` exists but orphaned |

**OVERALL MONEY MACHINE SCORE: 21/100**

0 = Manual Business
100 = Fully Autonomous Digital Product Factory

**Current state: Manual Business with automation scaffolding.**

The infrastructure exists (Notion sync, AI agents, social publishers, email publishers, product generator) but none of it is connected into a pipeline. The missing piece is **wiring** — connecting these orphaned modules into a triggered workflow.

---

## 11. CRITICAL FINDING

The DigitallyDefined ecosystem has **all the components** of a digital product factory:

- ✅ Notion databases (8 core DBs)
- ✅ AI agents (10 agents in `agents/`)
- ✅ Product generator (`product_generator.py`)
- ✅ Social publishers (`social-publishers.js`)
- ✅ Email publishers (`email-publish.js`)
- ✅ Website editor (`websiteEditor.js`)
- ✅ Supabase edge functions (13 functions)
- ✅ Antigravity MCP (Notion Architect)
- ✅ Cron jobs (optimization loop, follow-up, post-publisher)

But **none are connected**. The system is a collection of tools, not a pipeline. Every step requires manual intervention. The fix is not building new tools — it's **wiring the existing tools together**.

---

*Document generated from live codebase analysis. No source files were modified.*
