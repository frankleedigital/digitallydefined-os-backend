# DigitallyDefined Operating System — Transformation Blueprint

**Author:** Web Design Expert (SaaS/OS systems architect)
**Date:** November 17, 2026
**Status:** Approved architecture directive — OS-FIRST model
**Scope:** Full architectural audit of the current dashboard vs. the DigitallyDefined Operating System.

---

## Guiding Rules (non-negotiable)

- The retirement gap is the **WHY**. The dashboard is the **HOW**. The Operating System is the **PRODUCT**.
- **NOT** a retirement calculator. **NOT** a coaching portal. **NOT** a chat-first app.
- AI Business Partner = **orchestrator/assistant**, never the sole interface.
- The OS must stay fully useful with the AI Business Partner **offline**.
- Preserve working functionality. Reuse existing agents. Prioritize business outcomes.
- Organize around: **Assets, Opportunities, Content, Wealth, Automations, Projects, Agent Hub.**

---

## 1. CURRENT STATE ASSESSMENT

### 1.1 What exists and WORKS today (preserve & reuse)

| System | Location | Status | Notes |
| :--- | :--- | :--- | :--- |
| 6-tab dashboard shell | `DashboardPage.jsx` + `config.js` | ✅ Working | COMMAND / PRODUCTS / GROWTH / AUTOMATIONS / SYSTEM HEALTH / NOTION |
| Live lead metrics | `GrowthTab.jsx` → `leads.list`, `dashboard` | ✅ Working | Real Supabase counts, personas, funnel |
| Live Gumroad product sync | `ProductsTab.jsx` → `gumroad.products` | ✅ Working | Real-time published/draft badges from API |
| Workers control center | `AutomationsPage.jsx` → `automation.*` | ✅ Working | 5 worker cards + Launch Workflow |
| Integration diagnostics | `IntegrationsTab.jsx` | ✅ Working | Brevo/Meta/Slack/Telegram live states |
| Notion Architect | `AntigravityPage.jsx` → `antigravity.*` | ✅ Working | Now LIVE (4/8 DBs, liveMode on) |
| AI Business Partner | `businessPartner.js` + `aiRouter.js` | ✅ Working | gemini-3.5-flash-lite, ~1.2s |
| **Backend agent system** | `src/agents/` + `src/agents/hermes/` | ✅ Working | 13 agents + registry + orchestrator — **but no dashboard UI to browse them** |
| Quiz funnel (front door) | `digitallydefined.store/quiz` | ✅ Working | On-device scoring, lead capture |

### 1.2 What exists but does NOT align with the mission (fix)

| Item | Misalignment | Action |
| :--- | :--- | :--- |
| **COMMAND tab is chat-first** | Landing view = AI panel + morning brief; user must *talk* to act | Rebuild as **OPERATIONS** (OS data home); AI demoted to a side panel |
| **Intelligence views gated behind quiz** | `IntelligencePage.jsx` redirects to `/quiz` if no `dd-quiz-results`; agent UIs unusable by a logged-in owner without re-taking the quiz | Decouple agent views from quiz-gating; serve owner directly |
| **Wealth / retirement gap is invisible** | Freedom Number, Wealth Snapshot, Legacy OS all live **client-side on `digitallydefined.store`** — none in the dashboard; the "WHY" has no OS home | Build a first-class **Wealth Center** + Financial Resilience agents |
| **No Agent Hub** | 13 backend agents + 4 Hermes specialists exist but there is no way to *browse & open them directly* without chat | Build **Agent Hub** |
| **No Assets / Projects / Content / Opportunities sections** | Backend has `asset.*`, `revenue.snapshot`, content agents, opportunities agent — but no dashboard UI | Build the OS object sections |

### 1.3 Specialist agents that ALREADY exist (reuse, don't rebuild)

**Discovery Agents:**
- `quiz` → **Digital Superpower Agent** (processes quiz → superpower profile)
- `niche` → **Niche Intelligence Agent**
- `opportunities` → **Opportunity Agent**
- `trends` → **Trend Intelligence Agent**
- `competition`, `audience` → supporting discovery views

**Creation Agents:**
- `product` → **Product Generator Agent**
- `productAgent` (Hermes) → **Offer Architect / Product Designer**
- `roadmap` → **Authority Blueprint Agent**

**Content Agents:**
- `social` → **Social Content Agent**
- `contentAgent` (Hermes) → **Content Repurposing Agent**
- `affiliate.recommend` / `affiliate.click` → **Affiliate Flipper Agent**

**Digital Real Estate Agents:**
- `growthAgent` (Hermes) → **Rank-and-Rent / Growth Agent** (keyword, topical authority, content maps)

**Orchestrator:**
- `businessAgent` (Hermes) + `hermes/orchestrator.js` → **AI Business Partner**

### 1.4 Dashboard sections that are MISSING (the gap)

| Target OS section | Exists? | Backend support |
| :--- | :--- | :--- |
| **Asset Hub** (registry, valuations, digital real estate) | ❌ | Partial — `asset.activate`, `asset.marketing`, `assets.exists` |
| **Wealth Center** (retirement gap, resilience, legacy) | ❌ | ❌ none — no Financial Resilience agent |
| **Opportunities Center** | ❌ | ✅ `opportunities` agent + `OpportunitiesView.jsx` |
| **Content Center** (content queue, repurposing, publishing) | ❌ | ✅ `content` route, `socialContentEngine.js`, `publisher.social.publish` |
| **Projects** | ❌ | ❌ none |
| **Reports / Review** | ⚠️ | `ReviewCenter.jsx` (gated), `brain.brief`/morning brief |
| **Agent Hub** | ❌ | ✅ 13-agent registry + orchestrator, no UI |

### 1.5 Duplication & consolidation candidates

- **3 Notion tabs:** `pages/NotionTab.jsx`, `pages/tabs/NotionTab.jsx`, `pages/tabs/AntigravityTab.jsx` → collapse to ONE `AntigravityPage`.
- **`AssistantPage.jsx`** vs **COMMAND AI panel** — two AI surfaces. Consolidate into one orchestrator panel.
- **`fastapi/` Python backend + `fastapi.js` service** — dead duplicate (0 revenue, causes timeouts). REMOVE (per TOOLS audit item 20).
- **Dead OmniRoute Linode proxies** — REMOVE from `.env` (item 21).
- **`AnalyticsPage.jsx`** already redirected into GROWTH — delete the dead page, keep redirect.
- **Ephemeral local file queues** — standardize on Supabase (item 22).

---

## 2. TARGET ARCHITECTURE MAP

The target OS has **seven operating objects** and **one orchestrator**. Everything is data-first; the AI Business Partner coordinates in the background.

```
                         ┌──────────────────────────────┐
                         │   AI BUSINESS PARTNER        │  ← Orchestrator (side panel, never sole UI)
                         │  (businessAgent + orchestrator)
                         └──────────────┬───────────────┘
                                        │ coordinates
      ┌───────────┬───────────┬────────┴───────┬──────────────┬───────────────┐
      ▼           ▼           ▼                ▼              ▼               ▼
 ┌────────┐  ┌────────┐  ┌──────────┐   ┌────────────┐  ┌──────────┐   ┌──────────┐
 │ ASSETS │  │WEALTH  │  │OPPORTUN- │   │  CONTENT   │  │PROJECTS  │   │AUTOMATIONS│
 │        │  │CENTER  │  │ITY CENTER│   │  CENTER    │  │          │   │  & WORKERS│
 └────────┘  └────────┘  └──────────┘   └────────────┘  └──────────┘   └──────────┘
      │           │           │                │              │               │
      ▼           ▼           ▼                ▼              ▼               ▼
 DISCOVERY   FIN RES     DISCOVERY+CREATION  CONTENT       CREATION+       ALL AGENTS
 AGENTS      AGENTS      AGENTS              AGENTS        DRE AGENTS      (orchestrated)

        OPERATIONS (OS HOME) = dashboard of all objects + agent health + KPIs
```

**Object → Agent mapping (target):**

| OS Object | Agents that power it | State |
| :--- | :--- | :--- |
| **Assets** | Asset Acquisition (new), Domain Analyzer (new), Rank-and-Rent (`growthAgent`) | Partial |
| **Wealth** | Retirement Gap, Wealth Calculator, Asset Plan, Legacy OS (**all new**) | ❌ Missing |
| **Opportunities** | Opportunity, Niche Intelligence, Trend | ✅ Exists |
| **Content** | Social Content, Content Repurposing, Affiliate Flipper | ✅ Exists |
| **Projects** | Authority Blueprint (`roadmap`) | Partial |
| **Automations** | worker runners + orchestrator | ✅ Exists |
| **Agent Hub** | registry of ALL agents | ✅ Backend, no UI |

---

## 3. GAP ANALYSIS

### 3.1 Capability gaps (feature missing entirely)

| Gap | Impact | Severity | Effort |
| :--- | :--- | :--- | :--- |
| **Financial Resilience agent category** (4 agents) | The "WHY" (retirement gap) has zero OS representation | 🔴 Critical | Medium |
| **Agent Hub UI** | 13 agents unreachable without chat | 🔴 Critical | Low |
| **Asset registry & valuation** | No place to manage/appreciate digital real estate | 🔴 High | Medium |
| **Wealth Center** | No dashboard view of net-worth trajectory / gap closure | 🔴 High | Medium |
| **Opportunities Center** | Agent exists but no surfaced dashboard section | 🟠 Medium | Low |
| **Content Center** | Content agents exist but no queue/repurpose/publish dashboard | 🟠 Medium | Medium |
| **Projects / execution tracking** | No way to track "action plans" the orchestrator creates | 🟠 Medium | Medium |
| **Domain Analyzer + Asset Acquisition agents** | DRE pillar incomplete (only Rank-and-Rent exists) | 🟡 Medium | Medium |

### 3.2 Alignment gaps (feature exists but wrong shape)

| Misalignment | Current | Target |
| :--- | :--- | :--- |
| COMMAND = chat-first | AI panel is the landing | OPERATIONS = data landing, AI is a side panel |
| Agent views quiz-gated | `IntelligencePage` → `/quiz` redirect | Serve owner directly, quiz optional |
| Wealth tools siloed on store | Client-side calculators only | Wealth Center in dashboard + new agents |
| Notion architect orphaned | Standalone tab | Folded under AUTOMATIONS & WORKERS |
| PRODUCTS tab = shelf only | Read-only catalog | Assets object (manage + value + acquire) |

### 3.3 Duplication (consolidate)

- 3 Notion tab files → 1.
- 2 AI surfaces (`AssistantPage` + COMMAND panel) → 1 orchestrator panel.
- `fastapi/` + OmniRoute proxies + local file queues → delete (Supabase is the source of truth).

---

## 4. RECOMMENDED INFORMATION ARCHITECTURE

**Principle:** One object model. The left nav mirrors the operating objects; each object is data-first and agent-backed. AI Business Partner lives as a persistent right-side panel on every object page — *never* the page itself.

### Target navigation (8 OS tabs, grouped)

```
OPERATING SYSTEM
├─ OPERATIONS        ← OS home (was COMMAND): KPIs, active projects, agent health, today's priorities
├─ AGENT HUB         ← NEW: browse all 5 agent categories, open any agent, launch workflows
├─ ASSETS            ← NEW: digital real estate + product shelf registry, valuations, acquire/launch
├─ OPPORTUNITIES     ← NEW: discovery feed (niche/trend/opportunity agents), scored next moves
├─ CONTENT           ← NEW: content queue, repurposing, publish to Meta/IG/Threads/Pinterest
├─ WEALTH            ← NEW: retirement gap, net-worth trajectory, Legacy OS, financial resilience
├─ AUTOMATIONS       ← workers + workflows + Notion OS architect (consolidated)
└─ SYSTEM            ← health, integrations, status (was SYSTEM HEALTH + NOTION diagnostics)
```

**Folding rules (what disappears as standalone tabs):**
- `PRODUCTS & GUMROAD` → becomes the **product shelf** panel inside **ASSETS**.
- `GROWTH & SIGNALS` → its KPIs move to **OPERATIONS**; its lead stream stays as a signal panel in **OPERATIONS** (Growth tab removed as a standalone).
- `NOTION OS ARCHITECT` → panel inside **AUTOMATIONS**.
- `SYSTEM HEALTH` → merged into **SYSTEM**.

> Net: 6 tabs → 8 tabs, but the 8 are object-aligned and none are chat-first. Total unique content actually *increases* because Assets/Wealth/Opportunities/Content/Agent-Hub are real now.

### Page data sources (so the OS stays useful with AI off)

| Tab | Primary data source | AI-off fallback |
| :--- | :--- | :--- |
| OPERATIONS | `dashboard`, `leads.list`, `revenue.snapshot`, `automation.status` | Pure data cards, no AI needed |
| AGENT HUB | `listAgents()` (registry) | Static agent cards, runnable on demand |
| ASSETS | `gumroad.products`, `asset.*`, valuation store | Live Gumroad + stored valuations |
| OPPORTUNITIES | `opportunities`, `niche`, `trends` agents | Cached recommendations |
| CONTENT | `content`, `socialContentEngine`, publisher queue | Draft queue from Supabase |
| WEALTH | new `wealth.*` actions + stored snapshots | On-device calc (privacy-first) |
| AUTOMATIONS | `automation.*`, `antigravity.status` | Worker health only |
| SYSTEM | integration states, `status` | Diagnostics only |

---

## 5. AGENT HUB DESIGN

The Agent Hub is the OS's "app launcher" for the AI team. It makes the agent philosophy concrete: *every tool is an Agent; agents are specialists; the user opens them directly.*

### 5.1 Layout (Soft Brutalism)

- **Left:** 5 category groups (Discovery, Creation, Content, Digital Real Estate, Financial Resilience), each a collapsible card with a 2px black frame and a category color accent bar (0-radius).
- **Each agent card:** name (Inter 800 uppercase), one-line "what it does", a status pill (Ready / Running / Needs-Input), and an **OPEN** button.
- **Right rail (optional):** "Recent agent runs" (last 5) + a **COMBINE** button that hands a multi-agent request to the Business Partner orchestrator.

### 5.2 The 5 categories & their agents (reuse map)

| Category | Agents | Reuse from |
| :--- | :--- | :--- |
| **Discovery** | Digital Superpower, Niche Intelligence, Opportunity, Trend Intelligence | `quiz`, `niche`, `opportunities`, `trends`, `competition`, `audience` |
| **Creation** | Product Generator, Offer Architect, Product Designer, Authority Blueprint | `product`, `productAgent`, `roadmap` |
| **Content** | Social Content, Content Repurposing, Affiliate Flipper | `social`, `contentAgent`, `affiliate.*` |
| **Digital Real Estate** | Domain Analyzer *(new)*, Rank-and-Rent, Asset Acquisition *(new)* | `growthAgent` (+2 new) |
| **Financial Resilience** | Retirement Gap *(new)*, Wealth Calculator *(new)*, Asset Plan *(new)*, Legacy OS *(new)* | **none — build 4 agents** |

### 5.3 Interaction model

- **Open directly:** clicking OPEN runs that single agent with its input schema; result renders in a structured result panel (NOT chat).
- **Ask the Business Partner:** typing a goal (e.g. "make $2,000/mo") in the right-rail COMBINE box routes through `orchestrator.js` which fans out to Niche → Product → Asset Plan → Authority Blueprint and returns an action plan + tracked project.
- Every agent run writes a row to a `agent_runs` table (audit + "Recent runs").

### 5.4 New backend surface (small, additive)

```
GET  /api?action=agents.list          → registry (categories + status)
POST /api?action=agents.run          → { agent, params } → structured result
POST /api?action=agents.orchestrate  → { goal } → action plan + project id
```
All three are thin wrappers over the *existing* `agentRegistry` + `orchestrator.js` — no new AI logic, just a browse-and-launch layer.

---

## 6. DASHBOARD NAVIGATION DESIGN

### 6.1 Information scent (what the user sees in the first 3 seconds per tab)

- **OPERATIONS:** "You are operating a business." Top row = 4 KPI tiles (Revenue MTD, Active Assets, Leads, Automation Health). Second row = Today's Priorities (from orchestrator) + Agent Health strip. Right panel = AI Business Partner (collapsed by default).
- **AGENT HUB:** "Your team is here." 5 category cards, each with its agents and an OPEN affordance.
- **ASSETS:** "Here is what you own." Asset registry table (name, type, value, status, MRR) with a **product shelf** panel (live Gumroad) embedded.
- **OPPORTUNITIES:** "Here is what to do next." Scored discovery feed with a single primary CTA per card.
- **CONTENT:** "Here is what ships." Content queue (draft → scheduled → published) with repurpose + publish actions.
- **WEALTH:** "Here is how close you are." Retirement-gap gauge + net-worth trajectory + Legacy OS status.
- **AUTOMATIONS:** "Here is what runs while you sleep." Worker grid + workflow launcher + Notion architect.
- **SYSTEM:** "Here is what's connected." Integration health + environment diagnostics.

### 6.2 Consistent chrome (OS-first, Soft Brutalism)

- Single left nav (260px), top header with one logo left + global sync status right.
- Every object page = white cards, 1px solid #111 frames, 0-radius, flat colors; orange = primary action, aqua = secondary.
- AI Business Partner = **persistent right rail on OPERATIONS only**; on every other tab it's reachable via a single "Ask Partner" button that opens the same panel — never a full-page chat.
- **No tab renders an empty state that requires chat** — each tab has real data or an on-demand fetch fallback.

### 6.3 Migration path (no breaking the working 6 tabs)

1. Add the 5 new tabs behind feature flags; keep the 6 existing ones working.
2. Move `PRODUCTS` shelf → ASSETS; move `NOTION` → AUTOMATIONS; move `GROWTH` KPIs → OPERATIONS.
3. Flip the default landing from COMMAND (chat) to OPERATIONS (data).
4. Delete the now-redundant standalone tabs + 3 Notion files + `fastapi/`.

---

## 7. ASSET MANAGEMENT DESIGN

**Purpose:** Turn the scattered product shelf + digital real estate into one owned, valued, appreciating registry — the Pillar 2 (Digital Real Estate) object.

### 7.1 Data model (add to Supabase)

```
assets (id, name, type[product|domain|content|community|email_list],
       value_usd, mrr_usd, status[draft|live|paused], gumroad_id,
       owner, acquired_at, notes)
```
- Seed from **live Gumroad** (`gumroad.products`) + on-device valuations.
- Valuations stored locally-first (privacy rule); only aggregates sync.

### 7.2 UI (Soft Brutalism)

- **Assets table:** rows with value + MRR, status pill, type accent bar. Filter by type/status.
- **Asset detail drawer:** valuation trend, income, links to its products/content/projects.
- **Acquire panel (new):** Domain Analyzer + Asset Acquisition agent outputs appear here as "candidates to buy/build."
- **Product shelf panel:** the existing live Gumroad catalog (reuse `ProductsTab` body, re-skin).

### 7.3 Actions

- `asset.activate` / `asset.marketing` (existing) → wired to Launch / Promote buttons.
- New: `asset.valuation.record` (local), `asset.acquire` (runs DRE agents).

---

## 8. WEALTH CENTER DESIGN  *(the biggest gap — the "WHY")*

**Purpose:** Make the retirement gap and financial resilience a first-class OS object instead of a siloed client-side calculator.

### 8.1 Four new Financial Resilience agents (backend)

| Agent | Input | Output | Reuse |
| :--- | :--- | :--- | :--- |
| **Retirement Gap** | income, expenses, current assets, target age | gap $/yr, years-to-close | new (wrap client-side Freedom Number logic) |
| **Wealth Calculator** | net-worth snapshot, asset yields | trajectory, required monthly yield | new (wrap client-side Wealth Snapshot) |
| **Asset Plan** | gap + current assets | which digital assets close the gap, MRR targets | new (compose Asset Hub data) |
| **Legacy OS** | assets + family/caregiving context | Plan·Protect·Operate status | new (reuse LegacyOSPage content model) |

All run on **`aiRouter` (gemini-3.5-flash-lite)** + structured Supabase snapshots. No new infra.

### 8.2 Data (privacy-first)

- `wealth_snapshots (user_id, month, net_worth, monthly_income, monthly_expense, gap)` — stored locally, encrypted at rest, never leaves device for computation.

### 8.3 UI

- **Gap gauge:** current trajectory vs. target, flat progress bar (orange/aqua).
- **Trajectory chart:** 12/24/36-mo projection lines.
- **Asset Plan table:** which assets to build/acquire, MRR needed.
- **Legacy OS status:** Plan/Protect/Operate 3-tile checklist.
- AI-off fallback: the on-device calculators (Freedom Number, Wealth Snapshot) still work standalone.

---

## 9. OPPORTUNITIES CENTER DESIGN

**Purpose:** Surface the discovery agents' output as a prioritized "what to do next" feed — decision-ready, not a raw dump.

### 9.1 Data

- Reuse `opportunities`, `niche`, `trends`, `competition`, `audience` agent outputs.
- New `opportunity_scores (agent, target, score, rationale, created_at, status[open|adopted|done])`.

### 9.2 UI

- **Scored feed:** each card = opportunity, score (0–100), one-line rationale, **Adopt** → creates a Project.
- **Segment lens:** filter by the owner's Digital Superpower persona (from quiz) so opportunities match "builder" vs "strategist."
- **Primary CTA per card** (one clear action) — the "no fog" rule from the tools audit.

### 9.3 Loop

- Adopted opportunities → **Projects** (execution tracking) → completion feeds back into **Growth** signals + orchestrator context.

---

## 10. 90-DAY IMPLEMENTATION ROADMAP

**Sequencing principle:** fix OS-first landing & Agent Hub first (highest leverage, lowest risk), then the "WHY" (Wealth), then growth surfaces. No new AI spend until the $278 Vertex credit window is used up (expiring 2026-11-25) — all agent work routes through `gemini-3.5-flash-lite`.

### Days 1–15 — Phase A: OS-First Rebuild (de-risk the core)
- [ ] A1: Create `OPERATIONS` tab (data home); demote AI to right rail. (Low risk, reversible)
- [ ] A2: Build **Agent Hub** with `agents.list` + `agents.run` (browse & open, no chat).
- [ ] A3: Consolidate — delete 3 Notion tab files, `fastapi/`, dead OmniRoute proxies, local file queues.
- [ ] A4: Fold GROWTH KPIs into OPERATIONS; move Notion into AUTOMATIONS; PRODUCTS shelf into ASSETS.
- **Exit criteria:** OS navigable with AI off; no chat-first landing; codebase pruned.

### Days 16–35 — Phase B: The "WHY" (Wealth Center + Financial Resilience agents)
- [ ] B1: 4 new agents (Retirement Gap, Wealth Calculator, Asset Plan, Legacy OS) in `src/agents/`.
- [ ] B2: `wealth_snapshots` store + local-first computation.
- [ ] B3: **Wealth Center** UI (gap gauge, trajectory, asset plan, Legacy OS tiles).
- [ ] B4: Wire Wealth Center into the Agent Hub (Financial Resilience category now has 4 agents).
- **Exit criteria:** Owner sees their retirement gap & trajectory in-dash; agents appear in Hub.

### Days 36–60 — Phase C: Assets + Opportunities + Content objects
- [ ] C1: **Assets** object (`assets` table, seed from live Gumroad, valuation drawer).
- [ ] C2: DRE agents (Domain Analyzer, Asset Acquisition) + acquire panel.
- [ ] C3: **Opportunities Center** (scored feed, persona lens, Adopt→Project).
- [ ] C4: **Content Center** (queue, repurpose, publish — reuse `socialContentEngine` + `publisher.social.publish`).
- **Exit criteria:** Asset registry live; opportunities decision-ready; content ships without manual posting.

### Days 61–90 — Phase D: Projects + Reports + polish
- [ ] D1: **Projects** tracking (action plans from orchestrator become trackable projects).
- [ ] D2: **Reports/Review** center (morning brief + structured reports, ungated).
- [ ] D3: Final IA cleanup — flip feature flags, delete old standalone tabs, QA all 8 tabs AI-off.
- [ ] D4: Verify white-label SaaS readiness (gating, multi-tenant seams, no public dashboard links).
- **Exit criteria:** Full OS operating end-to-end; usable with AI offline; solo-founder maintainable.

### What explicitly does NOT happen
- No new AI model spend (stay on Vertex 3.5-flash-lite through the credit window).
- No coaching-portal features, no course modules, no standalone calculators-as-products-in-dash.
- No public link to `dashboard.digitallydefined.agency` (proof-of-concept gating preserved).

### Success metrics (definition of "works")
1. Every tab loads real data with AI Business Partner **disabled**.
2. Owner can open any of the ~15 agents from the Agent Hub without typing a chat prompt.
3. Retirement gap + 12-mo trajectory are visible in the dashboard within 5s of login.
4. One "Adopt opportunity" click creates a tracked project.
5. `fastapi/` + OmniRoute proxies removed; no duplicate Notion tabs; Vercel build stays 100% green.


---

## PHASE B STATUS — Financial Resilience (COMPLETE 2026-11-17)

The "WHY" now has a home in the OS.

### Delivered
- **4 new agents** in `digitallydefined-os-backend/src/agents/`:
  - `retirementGap.js` — `calculateRetirementGap` (monthly/annual gap, nest egg, years-to-close, strategic actions)
  - `wealthCalculator.js` — `calculateWealth` (12/24/36-mo net-worth trajectory, asset growth rate, accelerators)
  - `assetPlan.js` — `generateAssetPlan` (which digital assets close the gap, MRR projection, priority order)
  - `legacyOSAgent.js` — `evaluateLegacyOS` (Plan·Protect·Operate 3-pillar readiness, sovereign status)
- All 4 registered in `agentRegistry` and the hub's **Financial Resilience** category (no longer "Coming in Phase B").
- Each has a **deterministic fallback** (works even if the AI gateway is down — OS-first principle).
- **WEALTH CENTER** dashboard tab (`WealthCenter.jsx`, id `wealth`, DollarSign icon): Legacy OS pillar cards + Retirement Gap agent + Wealth Trajectory agent with input forms, run buttons, and structured result cards. "Open Agent Hub" CTA to reach all 4.

### Live verification
- `agents.list` now returns **18 launchable agents** across all 5 categories (was 14).
- Financial Resilience: [Retirement Gap, Wealth Calculator, Asset Plan, Legacy OS].

### Updated gap list
| Item | Status |
| :--- | :--- |
| Financial Resilience agents | ✅ DONE (4 agents) |
| Wealth Center dashboard | ✅ DONE (B2) |
| Asset Plan agent | ✅ DONE (bonus — was Phase C) |
| Domain Analyzer / Asset Acquisition agents (DRE) | ⏳ still Phase C |
| Assets object tab | ⏳ Phase C |
| Opportunities Center / Content Center tabs | ⏳ Phase C |
| Projects tracking | ⏳ Phase D |
