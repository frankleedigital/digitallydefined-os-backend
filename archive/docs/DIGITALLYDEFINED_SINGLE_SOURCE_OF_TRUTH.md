# DIGITALLYDEFINED SINGLE SOURCE OF TRUTH
**CEO Decision Document · Effective Immediately · 2026-11-10**

---

## THE OFFICIAL VISION (5 sentences)

DigitallyDefined is a digital marketing dashboard for Gen X women building faceless digital real estate to close the retirement gap. It delivers personalized roadmaps through an AI Business Partner that analyzes business data and recommends next actions. The platform is built on Notion Workspaces (Digital Business OS) that organize every asset, workflow, and metric in one system. Revenue comes from selling products, subscriptions, and white-label licenses — not services. Everything else is noise.

---

## THE OFFICIAL PRODUCT HIERARCHY (Top 5 Flagships)

| Rank | Product | Type | Price | Status | Action |
|---|---|---|---|---|---|
| 1 | **Digital Business OS** (Notion system) | System | $97-197 | LIVE (but price drift) | FIX: One SKU, one account, $49 entry |
| 2 | **Digital Superpower Quiz + Roadmap** | Funnel Head | Free→$47 | LIVE (UI) | WIRE: ai.brief → roadmap |
| 3 | **Rank & Rent Academy Suite** | Software Suite | $47-97 | Complete | LIST: Bundle R&R tools as one product |
| 4 | **Unfiltered Balance Sheet** | Interactive Tool | $27-47 | Complete | LIST: The mission math made interactive |
| 5 | **Retirement Mastery for Gen X Women** | Book + Tools | $47-67 | NOT LISTED | LIST: Combine 2-part ebook |

**Everything else becomes:**

| Category | Products | Price Range |
|---|---|---|
| Lead Magnets | Local SEO Checklist, Niche Audit xlsx, Estate Docs, Scam Plan | FREE |
| Entry Offers | Digital Property Starter Kit, 50 AI Prompts, Legacy Building | $17-27 |
| Core Offers | High-Ticket Affiliate Guide, Keyword Suite, Catch-Up OS, Intent to Income | $27-47 |
| Upsells | DBO Full Tier, AI Partner Subscription, Growth OS | $29-99/mo |

---

## THE OFFICIAL DASHBOARD VISION

### What Customers See (Public/Quiz Path)
1. **Homepage /`** — Quiz CTA only, DBO card below fold
2. **Quiz Results `/quiz/results`** — Persona card → ONE CTA per persona
3. **Roadmap View** — Personalized after quiz (ai.brief wired)
4. **Analytics Card** — Live GA numbers (post-migration)
5. **Intelligence Tab** — 9 views, but fake data until ai.brief is wired

### What Owners See (Backend Admin)
1. **Supabase Dashboard** — User records, quiz submissions, leads
2. **Revenue Snapshot** — Gumroad sales tracked via webhook
3. **Lead Capture Queue** — Email list via Brevo
4. **Affiliate Program Manager** — Commission tracking

### What Gets Removed
- **Reputation Command Center** — B2B-only, defer to post-V1
- **Antigravity Notion Architect** — Keep working, hide from customers (owner tool)
- **All placeholder UIs** — "Connected sources" card becomes real or gets deleted

### What Gets Hidden
- **Hermes Chat Assistant** — Works, but not critical path; keep it
- **Growth Tab analytics** — Shows GA numbers, wire up recommendation engine later
- **Dashboard settings** — Owner-only, not customer-facing

### What Gets Merged
- **Intelligence Dashboard** + **Roadmap** = unified "Your Growth Plan" view
- **Antigravity** + **Notion Tabs** = admin workspace manager

---

## THE OFFICIAL AI STRATEGY

### We Have ONE AI Brain

| Component | Role | Status | Priority |
|---|---|---|---|
| **AI Router** (`src/services/aiRouter.js`) | Central hub | 80% complete | #1 WIRE TODAY |
| **Gemini Direct** | Primary LLM | LIVE | Keep |
| **OmniRoute** | Fallback (retired) | DEAD | Remove references |
| **Supabase Functions** | Backend actions | LIVE | Extend with AI-powered ones |
| **Antigravity** | Notion automation | LIVE | Owner tool only |
| **FastAPI Microservice** | Future-proofing | LOCAL ONLY | Archive for now |

**Decision:** All AI requests route through `aiRouter.js`. No direct API calls from frontend. No multiple AI experiences. One brain, many applications.

---

## THE OFFICIAL 90-DAY PLAN (Top 10 Initiatives)

| Rank | Initiative | Why #1-10 | Revenue Impact | Time to Deploy |
|---|---|---|---|---|
| **1** | **Fix DBO pricing + unify to one account** | Without this, revenue tracking is broken | HIGH | Day 0-1 |
| **2** | **Apply revenue migration SQL + wire Gumroad webhook** | Track every sale; stop phantom zeros | HIGH | Day 0-1 |
| **3** | **Wire ai.brief to Intelligence Dashboard** | Fake data stops; roadmap becomes real | HIGH | Week 1 |
| **4** | **List 12 READY NOW products on Gumroad** | First revenue from existing assets | HIGH | Weeks 1-4 |
| **5** | **Fix Brevo email capture** | Lead magnet delivery broken | MEDIUM | Day 2-3 |
| **6** | **Deploy public tools to `/public/`** | Affiliate Flip Calculator, 10x ROI, etc. | MEDIUM | Week 1 |
| **7** | **De-dupe 29 items (delete dups)** | Clean house before scaling | LOW | Week 2 |
| **8** | **Build 6 bundle families** | Increase AOV from $27 to $97 | MEDIUM | Weeks 5-8 |
| **9** | **Launch AI Partner subscription ($29/mo)** | Recurring revenue proof | HIGH | Weeks 9-13 |
| **10** | **White-label prep + beta tenants** | Enterprise path | HIGH | Weeks 13+ |

---

## THE KILL LIST (Remove from Consideration)

### Features to Kill
- ❌ **Reputation Command Center** — B2B-only, defer indefinitely
- ❌ **OmniRoute integration** — Retired, remove all references
- ❌ **Multiple AI routing** — One brain only
- ❌ **Faceless marketing blog** — Content channel ≠ core product
- ❌ **Legacy OS dashboard** — Mine components, delete parent

### Products to Archive
- ❌ **Digital Wealth Toolkit** — Superseded by Unfiltered Balance Sheet
- ❌ **Gen X Financial Power Suite** — Merge into Balance Sheet
- ❌ **Legacy OS Phase 1 MVP** — Components mined, parent deleted
- ❌ **AI Realtor MVP** — Off-niche, archive forever
- ❌ **Keyword Quest Game** — Use as lead magnet only, not standalone

### Plans to Delete
- ❌ **DD_V1_VISION_ROADMAP.md** — Replaced by THIS document
- ❌ **REVENUE_PLATFORM_ROADMAP.md** — Merged into Top 10 Initiatives
- ❌ **V1_SIMPLIFICATION_PLAN.md** — Consolidated here
- ❌ **DIGITAL_PRODUCTS/STORE_PRODUCT_ROADMAP.md** — Merged into Product Hierarchy
- ❌ **ALL OLD AUDITS** — superseded by this decision framework

### Tools to Delete
- ❌ **4 copies of Freedom Number Calculator** → keep 1
- ❌ **4 copies of 10x ROI Calculator** → keep 1 (live deployed)
- ❌ **Duplicate Legacy Command Centers** → keep 1 (mine components)
- ❌ **3 copies of Unfiltered Balance Sheet** → keep best version

---

## EXECUTION COMMANDS

```bash
# Today (Day 0)
cd ~/Documents/DigitallyDefinedClean/digitallydefined-dashboard
npm run build && vercel --prod    # Deploy DBO fix + live tools

# Tomorrow (Day 1)
cd ~/Documents/DigitallyDefinedClean/digitallydefined-os-backend
supabase db push                  # Apply revenue migration
vercel deploy --prod             # Deploy webhook receiver

# This Week (Days 2-7)
# Wire ai.brief → Intelligence Dashboard
# List 12 products on Gumroad
# Fix Brevo email capture

# This Month (Days 8-30)
# Deploy remaining tools to /public/
# De-dupe 29 items
# List bundles (R&R Academy, Empire Suite)

# Next Quarter (Days 31-90)
# Launch AI Partner subscription
# White-label beta tenants
```

---

## APPROVED BY
**Chief Product Officer** · DigitallyDefined  
**Date:** 2026-11-10  
**Status:** EFFECTIVE IMMEDIATELY

---

*This document supersedes all prior strategy, roadmaps, and audit reports. Every other .md file in this folder should be archived or deleted within 7 days.*
