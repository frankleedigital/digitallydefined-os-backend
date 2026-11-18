# DIGITALLYDEFINED DASHBOARD
## PRODUCT REQUIREMENTS DOCUMENT (PRD)
*As-Built Implementation Audit — Current State Source of Truth*

---

# 1. Executive Summary

### What the dashboard appears designed to accomplish today
The DigitallyDefined Dashboard is designed as a standalone, private, AI-powered Business Operating System for digital asset creation, revenue generation, and financial independence. It combines direct operational tools, automated data synchronization (Gumroad, Brevo, Supabase), and an ecosystem of 20 specialist AI agents into a single unified React single-page application (SPA) backed by a Node.js serverless API.

### Who the intended user is
Gen X women transitioning from employees/consumers to digital asset owners, creators, and entrepreneurs, building sustainable long-term income and financial resilience.

### What business problem it attempts to solve
It solves the fragmentation of digital business management. Rather than forcing users to juggle disconnected retirement calculators, course portals, and SaaS tools, the OS provides a unified command center where users can browse opportunities, create digital products, manage wealth trajectories, flip traffic into affiliate revenue, audit brand compliance, and execute automated workflows without chat-first dependency.

---

# 2. Product Vision
Based on the codebase (`config.js`, `DashboardPage.jsx`, agent registries, and backend routers), the intended vision of the platform is an **Operating System First, AI Enhanced Second** architecture. 
- The dashboard is a fully functional digital business command center even when AI reasoning is offline.
- The AI Business Partner (Hermes) and 20 specialist agents act as orchestrators and workers embedded directly into dedicated workflow tabs and an Agent Hub.
- Design adherence is strictly enforced around Flat Soft Brutalism (square edges, 0px border radius, high-contrast solid borders, zero shadows).

---

# 3. Information Architecture
The application structure discovered across `src/config.js` and `DashboardPage.jsx`:

```
Dashboard Root (dashboard.digitallydefined.agency)
├── OPERATIONS (Command Center & Morning Brief)
├── AGENT HUB (20 Specialist AI Agents across 6 Categories)
├── WEALTH CENTER (Retirement Gap & Net Worth Trajectory Calculators)
├── AFFILIATE FLIPPER (Traffic ⇄ Product Match & Affiliate Flip Scoring)
├── BRAND SUPERVISOR (Brand Constitution Audit & Voice Check)
├── PRODUCTS & GUMROAD (Live Product Catalog & Publication Status)
├── GROWTH & SIGNALS (Lead Stream, Persona Breakdown & Analytics)
├── AUTOMATIONS & WORKERS (System Automations & OS Workers)
├── SYSTEM HEALTH (Integrations, Slack Test & Daily Report Actions)
└── NOTION OS ARCHITECT (Notion Database Wiring & Live Mode Status)
```

### Discovered Backend API Routes (`digitallydefined-os-backend/api/index.js`)
- `POST /api?action=agents.list` — List all registered agents and categories.
- `POST /api?action=agents.run` — Execute a specialist agent with parameters.
- `POST /api?action=agents.orchestrate` — Route a goal through the AI Business Partner.
- `POST /api?action=gumroad.products` — Fetch live product publication status from Gumroad API.
- `POST /api?action=slack.test` — Post connectivity test message to Slack.
- `POST /api?action=slack.report` — Post daily empire metrics report to Slack.
- `POST /api?action=automation.sync` — Trigger Notion / backend sync operations.
- `GET /api/cron-morning` — Scheduled morning brief generator and email/Slack dispatcher.
- `GET /api/cron-daily-report` — Scheduled 6:00 AM daily Slack report.

---

# 4. Navigation Audit

| Navigation Item | Purpose | Destination Component | Current Status | Dependencies |
|---|---|---|---|---|
| **OPERATIONS** | Main command overview, morning brief, empire stats, quick actions | `CommandTab.jsx` | **Working** | Supabase REST, AI Morning Brief generator |
| **AGENT HUB** | Browse, filter, and directly launch specialist agents | `AgentHub.jsx` | **Working** | Agent Registry (`hub.js`), `agents.run` API |
| **WEALTH CENTER** | Retirement gap calculations and net-worth trajectory projections | `WealthCenter.jsx` | **Working** | Retirement & Wealth agents |
| **AFFILIATE FLIPPER** | Traffic opportunity & monetization match analysis | `AffiliateFlipperTab.jsx` | **Working** | `affiliateFlipper` agent, scoring engine |
| **BRAND SUPERVISOR** | Audit copy and assets against brand guidelines | `BrandSupervisorTab.jsx` | **Working** | `brandSupervisor` agent, constitutional prompts |
| **PRODUCTS & GUMROAD** | Manage digital product shelf and live Gumroad sync | `ProductsTab.jsx` | **Working** | Gumroad API (`lavignefrancesca@gmail.com`) |
| **GROWTH & SIGNALS** | Real-time quiz lead stream, acquisition trends, persona counts | `GrowthTab.jsx` | **Working** | Supabase `quiz_roadmaps`, Brevo contacts |
| **AUTOMATIONS & WORKERS** | Worker status, background jobs, and task logs | `AutomationsPage.jsx` | **Working** | Background workers backend |
| **SYSTEM HEALTH** | Diagnostics, integration links, Slack test & report triggers | `IntegrationsTab.jsx` | **Working** | `lib/slack.js`, Vercel environment checks |
| **NOTION OS ARCHITECT** | Notion database wiring and live mode approval status | `AntigravityPage.jsx` | **Working** | Supabase edge / Notion API bridge |

---

# 5. Dashboard Audit

### Main Dashboard (`OperationsTab.jsx` / `CommandTab.jsx`)
- **What it displays:** Empire KPI summary (Revenue, Community, Email Subscribers, Top Asset Value), AI Morning Brief (Working, Slipping, Next Actions), quick action triggers, and the collapsible AI Business Partner rail.
- **Data source:** Supabase metrics tables, Brevo API stats, and AI router (`gemini-3.5-flash-lite`).
- **Current functionality:** Fully operational. Displays real-time metrics, renders structured morning briefs, and allows direct conversation with the AI Business Partner or launching the Agent Hub.
- **Missing functionality:** None identified for MVP operations.
- **Relationship to other systems:** Acts as the central command node connecting all backend data syncs and agent routes.

---

# 6. AI Systems Audit

### 1. Hermes / AI Business Partner (`src/routes/businessPartner.js`, `src/agents/hermes/`)
- **Purpose:** Acts as co-founder and orchestrator. Classifies user intent, delegates to specialist agents, and formats strategic responses.
- **Implementation:** Routes through `aiRouter.js` targeting Google Cloud Vertex Gemini (`gemini-3.5-flash-lite`) with OmniRoute fallback. Non-blocking context timeout protection (2.5s race).

### 2. Agent Registry & Hub (`src/agents/`)
- **Purpose:** Central registry of 20 specialist AI agents.
- **Complete List of Registered Agents:**
  1. `niche` — Niche Intelligence
  2. `roadmap` — Authority Blueprint
  3. `scorecard` — Performance Scorecard
  4. `product` — Product Generator
  5. `social` — Social Content
  6. `trends` — Trend Intelligence
  7. `competition` — Competition Scout
  8. `audience` — Audience Insight
  9. `opportunities` — Opportunity Scanner
  10. `quiz` — Digital Superpower Quiz Processor
  11. `retirementGap` — Retirement Gap Calculator
  12. `wealthCalculator` — Wealth Trajectory Calculator
  13. `assetPlan` — Asset Recommendation Plan
  14. `legacyOS` — Legacy OS 3-Pillar Readiness
  15. `affiliateFlipper` — Affiliate Flipper AI (Traffic Match & Flip Score)
  16. `brandSupervisor` — Brand Supervisor AI (Voice & Aesthetic Audit)
  17. `businessAgent` — Hermes Business Strategy Specialist
  18. `contentAgent` — Hermes Content Creation Specialist
  19. `growthAgent` — Hermes Growth & SEO Specialist
  20. `productAgent` — Hermes Product & Gumroad Specialist

---

# 7. Integrations & External Services Audit

- **Gumroad:** Linked to Francesca LaVigne (`lavignefrancesca@gmail.com`). Fetches live product publication statuses via `api/index.js` `gumroad.products`.
- **Brevo:** Email subscriber synchronization, lead capture storage, and automated quiz roadmap email delivery.
- **Slack:** Fully configured with `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID`. Supports manual test alerts (`slack.test`), daily empire metrics reports (`slack.report`), scheduled 6:00 AM daily cron reports, and automatic new-quiz-lead onboarding alerts.
- **Supabase:** Core database for user authentication, quiz roadmaps (`quiz_roadmaps`), and state persistence. Connected via linked Supabase project (`dijjlppdljpcgyoakdnq`).
- **Notion OS Architect:** Configured with `NOTION_LIVE_MODE=true` and `NOTION_PHASE21_LIVE_APPROVAL=true`. Manages workspace databases (Digital Assets, Ideas & Intake, Content Blocks, Automations Log).
- **Google Cloud Vertex Gemini:** Primary AI reasoning engine (`GEMINI_API_KEY`), utilizing expiring Google Cloud credits.

---

# 8. Revenue & Monetization Systems
- ** Gumroad Digital Storefront:** Direct permalinks (`shop.digitallydefined.store`) and flagship funnel landing page (`legacyos.digitallydefined.store`).
- **Affiliate Flipper Engine:** Evaluates search intent, CPC, commission structure, and recurring vs. one-time payouts to generate an Affiliate Flip Score (0-100) and multi-tier revenue projections.
- **Privacy Gating:** The SaaS dashboard (`dashboard.digitallydefined.agency`) is strictly gated behind auth; public traffic lands exclusively on public-facing sales funnels (`digitallydefined.store` and `legacyos.digitallydefined.store`).

---

# 9. Design System & Frontend Architecture
- **Framework:** React SPA built with Vite, styled using inline CSS objects enforcing Flat Soft Brutalism.
- **Design Rules:** 
  - Zero border-radius (`border-radius: 0px`).
  - Solid 1px / 2px dark borders (`#111111` / `#2D3748`).
  - Zero drop shadows (`box-shadow: none`).
  - Flat color palette: Background `#FFFCF9`, Cards `#FFFFFF`, Primary Accent DD Orange `#F18B25`, Secondary Accent Aqua Blue `#47B7D4`, Success Green `#2A9D5C`, Alert Red `#C20F0A`.
  - Typography: Headings in Inter Bold (ALL UPPERCASE), body in DM Sans.

---

# 10. Unfinished, Placeholder, or Blocked Items (As-Built Reality Check)
1. **Meta Facebook Group Posting:** Returns HTTP 400 because the custom Meta App requires Group Publish Permission or app installation inside the private Facebook Group (`1050373128164124`).
2. **Threads API:** Access token expired; requires manual OAuth developer re-authentication.
3. **Notion Database Completeness:** 4 of 8 core databases are fully wired; the remaining 4 (Money, Monthly, Reputation, Templates) lack their specific `NOTION_*_DB_ID` environment variables on Vercel.

---
*Document generated as the authoritative As-Built Source of Truth for the DigitallyDefined Dashboard.*
