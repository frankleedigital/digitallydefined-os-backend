# DIGITALLYDEFINED — V1 OPERATIONAL BLUEPRINT
**The single answer. One business, six subsystems, zero alternatives.**

> DigitallyDefined is a self-operating digital product business for Gen X women.
> It creates products, publishes them, promotes them, tracks traffic → leads → sales,
> and recommends the next move. Everything else is deleted or archived.

---

# 1. CURRENT REALITY MAP (what exists today → verdict)

| Component | Today | Verdict | Supports the 6 pillars? |
|---|---|---|---|
| `digitallydefined-dashboard` 5 tabs | LIVE Vercel | **KEEP — slim to 3 tabs** | Dashboard ✅ |
| Dashboard routes `/intelligence`, `/analytics` | duplicate of tab content | **MERGE into COMMAND/GROWTH, hide routes** | redundant |
| `NOTION OS` + `AUTOMATIONS` tabs | owner dashboard bar | **HIDE from owner bar → customer journey** (post-purchase features) | product delivery, not owner insight |
| `/quiz` → `/quiz/results` → `/onboarding` → `/store` | live funnel | **KEEP** | Leads ✅ |
| 3 live HTML tools in `public/` | live, unsold | **KEEP — list on Gumroad Day 1** | Sales ✅ |
| `digitallydefined-os-backend` `/api` (30 actions) | LIVE Vercel | **KEEP** | all 6 ✅ |
| `supabase/functions` (14 fns) | LIVE Supabase | **KEEP** (sellable, analytics, post-publisher, sync, hermes, followup) | Sales + Content ✅ |
| `digitallydefined-os-workers` (CF agents) | built, undeployed | **KEEP 3, archive 3** | see below |
| `digital-products` app | built, undeployed | **KEEP — the Product Factory** | Factory ✅ |
| Gumroad (3 live listings) | live checkout | **KEEP — the Store's checkout** | Sales ✅ |
| Brevo email | 401 broken | **FIX** | Leads ✅ |
| Facebook group/post-publisher | fixed fields, flowing | **KEEP — Content Engine** | Content ✅ |
| `archive/` (70M), `Hermes/`, `docs/`, `workspace/buzz-agents` | dead/scratch | **ARCHIVE** | none of the 6 |
| ~100 root report .md files | decision docs | **KEEP 3, ARCHIVE the rest** | reference only |
| root one-shot scripts (exec-migration, dumpkeys, _*.py, audit_*) | done | **DELETE** | none |

**Workers: keep** `contentAgent`, `plannerAgent`, `productPublisher` (Content Engine + Factory). **Archive** `notionArchitect`, `researcher`, `templateBuilder` (Notion direction parked; no revenue path yet).

# 2. V1 BLUEPRINT — "if it were finished tomorrow"

## A. DASHBOARD (owner command center — exactly 3 tabs)
1. **COMMAND** — AI morning brief + KPI strip (traffic · leads · revenue · conversion) + THE ONE NEXT ACTION + system alerts
2. **PRODUCTS** — every product: status (listed/sold/traffic), revenue/SKU, "Ask Hermes to Market This"
3. **GROWTH** — traffic by source · quiz funnel · content performance · active campaign
HIDDEN from owner bar (moved to customer journey after purchase): NOTION OS, AUTOMATIONS
DELETED routes: /intelligence, /analytics (content now inside tabs)

## B. CUSTOMER JOURNEY (public routes, one path)
/quiz → /quiz/results → /onboarding → /store → /thank-you-calculator
Customer features (after purchase): automations, notion roadmap
**Rule: no product exists without a purchase path.** Every SKU in PRODUCTS tab links to its Gumroad listing; every listing delivers via `sellable` edge function.

## C. STORE
- Official storefront = `digitallydefined.store` (product pages: name · description · price · category · purchase · delivery)
- Checkout = Gumroad (3 live listings today: digital-business-os, ycaru, noodsi)
- The 3 live HTML tools = SKUs 4-6 (Day-1 listing)

## D. PRODUCT FACTORY WORKFLOW (one pipeline, no exceptions)
1. Pick from the 49 scored assets (DIGITALLYDEFINED_INTERACTIVE_ASSET_REPORT.md)
2. Build to brand standard (soft brutalism: white cards, thin black frames, grid, flat 2D icons)
3. List on Gumroad (price from GUMROAD_LISTING_SEQUENCE.md ladder)
4. Deliver via `sellable` edge function + thank-you flow
5. Track: views (/store GA event) → purchase (gumroad webhook) → revenue (revenue.snapshot)

## E. AI BUSINESS PARTNER WORKFLOW (morning advisor)
Every morning, scheduled run of `brain.brief` → one email (Brevo) + COMMAND tab:
- top content performer · product gaining traction · product needing promotion · traffic platform · next post to create
Output = one decision, not a report.

## F. CONTENT ENGINE WORKFLOW (one campaign at a time)
Campaign object (e.g. "2027 Is Your Catch-Up Year") → drives:
Facebook Page · Facebook Group · Instagram · Threads · Pinterest
All five channels post the same campaign theme via `post-publisher` (Supabase edge fn, LIVE) + CF `contentAgent`. One campaign, one message, five channels.

## G. DATA FLOW (only decision-useful data)
GA4 (traffic/source) + quiz completions + /store product views + Gumroad sales webhook + Brevo subscribers
→ Supabase (source of truth) → GROWTH tab + revenue.snapshot → AI partner → next action
Stop collecting anything that doesn't feed a decision.

# 3. KEEP / ARCHIVE / DELETE

## KEEP (the 4 systems + 3 docs, everything else is optional)
- digitallydefined-dashboard (3 tabs: COMMAND, PRODUCTS, GROWTH)
- digitallydefined-os-backend (/api + 14 supabase functions)
- digital-products (the factory; brand-standard builds)
- CF workers: contentAgent, plannerAgent, productPublisher
- Gumroad checkout (3 live listings)
- Docs to keep: this blueprint, GUMROAD_LISTING_SEQUENCE.md, brand guide

## ARCHIVE (park, no revenue path yet)
- CF workers: notionArchitect, researcher, templateBuilder
- NOTION OS + AUTOMATIONS tabs (move to customer journey, hide from owner bar)
- archive/ folder (70M), Hermes/, docs/, workspace/buzz-agents
- ~97 root report .md files

## DELETE
- One-shot scripts: exec-migration.js, dumpkeys.py, _*.py, audit_* (outputs done)
- agentops.log, *.bak, root dist/, output/
- /intelligence + /analytics duplicate routes

# 4. MISSING PIECES (what stands between today and V1)
1. **Revenue loop closed** — Gumroad sales webhook → Supabase `gumroad_sales` → revenue.snapshot. (SQL migration unapplied; today the business cannot report "what sold".)
2. **Lead loop closed** — Brevo 401 fixed; subscribers + quiz completions flowing.
3. **AI on schedule** — daily morning brief pushed to Brevo email + COMMAND (today it only runs when you open the dashboard).
4. **Campaign object** — one active campaign ("2027 Is Your Catch-Up Year") driving all 5 content channels.
5. **Store unification** — every SKU in the PRODUCTS tab has a live Gumroad link (3 of 34 sellable tools listed; 31 unlisted).
6. **digital-product factory standard** — the 49-asset scorecard + listing sequence exist; the work is listing Day-1 SKUs.

# 5. EXACT EXECUTION ORDER (Traffic → Leads → Sales → Recommendations)
| # | Task | Effort | Unlocks |
|---|---|---|---|
| 1 | Apply SQL migration + Gumroad sales webhook/sync | 1 day | the business can finally see revenue |
| 2 | Fix Brevo key | 1 hr | leads tracked |
| 3 | Dashboard 3-tab slim-down; move NOTION OS + AUTOMATIONS to customer journey | 1-2 days | command center answers the 6 questions |
| 4 | Daily AI morning brief (cron → Brevo + COMMAND) | 1 day | recommendations every morning |
| 5 | Launch campaign "2027 Is Your Catch-Up Year" → post-publisher → 5 channels | 2-3 days | traffic from content |
| 6 | List Day-1 SKUs on Gumroad (5 free/gated + R&R Academy + Unfiltered Balance Sheet) | 1-2 days | first sales |
| 7 | Execute the DELETE/ARCHIVE list from §3 | 1 hr | one coherent system |

**Done = open the dashboard in the morning, read one brief, take the one action it recommends, and the system sells, promotes, and learns while you sleep.**
