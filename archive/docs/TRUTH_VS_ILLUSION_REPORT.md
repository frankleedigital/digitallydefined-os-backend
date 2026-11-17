# TRUTH vs ILLUSION REPORT
**2026-11-10 · Brutal honesty pass. No protecting previous work.**
Format per item: **Feature · Location · Current state · Why it's fake · User risk · Action**
Action key: **[KEEP] [REBUILD] [DELETE]** — [HIDE] and [DEFER] allowed where noted.

---

## TIER 1 — Hardcoded fake data presented as live (highest user risk)

### 1. "Intelligence" / AI Business Partner data
- **Location:** `os-backend/api/index.js` L1769 `action === 'intelligence'`; feeds `/intelligence` + DashboardPage `IntelTab`
- **Current state:** Returns **hard-coded** `superpower: 'Builder'` for everyone, canned 3 recommendations, canned "30-60 days" roadmap. Every user, every visit.
- **Why it's fake:** The response body is a static JSON literal in the handler. No API call, no model, no user data.
- **User risk:** A paying customer's "AI partner" telling them they're "the Builder" when their quiz said Creator = the product actively lying to the buyer.
- **Action:** **[REBUILD]** — kill the literal; serve the Central AI Brain output (V1 plan §4). Until then **[HIDE]** the tab.

### 2. "Daily brief" (BrainTab)
- **Location:** `api/index.js` `action === 'brain.brief'` (~L1789)
- **Current state:** Hard-coded brief with `generatedAt` **frozen at 2026-05-25**, invented `market_gaps` ("Underserved offer angle", `confidence: 88`), invented `build_next` ("Lead magnet — Gen X digital income angle"), invented `stale_automations` ("Ideas Intake enrichment / Gumloop / no sync in 48h").
- **Why it's fake:** Entire payload is a static literal; the confidence scores and automation names are invented on the spot.
- **User risk:** Fake numbers (88%, "48h no sync") are the most dangerous kind of fake — they look like monitored telemetry.
- **Action:** **[DELETE]** the literal; replace with real data or remove BrainTab from the customer view.

### 3. "Automations" panel
- **Location:** `api/index.js` L1847-1895 `automation.sync/list/logs/run/events`
- **Current state:** `sync` returns **invented** `leads: 12, revenue: 48000, conversion: 0.18` and "Vault synced successfully"; `list` returns two automations that don't exist ("Daily Vault Sync", "Lead Enrichment"); `logs` returns fabricated log lines; `run` does **nothing** and reports success.
- **Why it's fake:** All static literals; `automation.run` is a no-op success.
- **User risk:** A dashboard that claims an automation ran when nothing ran. If a customer automates anything here, it silently does nothing.
- **Action:** **[DELETE]** the endpoints; **[HIDE]** AutomationsTab from customers. (Real automation = the revenue-platform triggers + Brevo leg; build that, don't fake the panel.)

### 4. "Product factory" marketing-package generator
- **Location:** `api/index.js` `action === 'asset.marketing'`
- **Current state:** "Generates" a marketing package from a **template string** ("Save time, reduce overwhelm, get results", "Gen X women") and pushes it to Notion. No model call.
- **Why it's fake:** It's find-and-replace on a boilerplate labeled as AI output.
- **User risk:** Buyers think they bought an AI generator; they got mail-merge.
- **Action:** **[REBUILD]** into a real Brain-powered variant (cheap: one Gemini call over the template) or **[DELETE]**.

## TIER 2 — Dead/broken "AI" paths (intelligent-looking, actually dark)

### 5. Analytics "AI recommendations"
- **Location:** Supabase `analytics` edge function `recommend` action → Dashboard `AnalyticsPage` "recommend" panel
- **Current state:** The action calls for `OMNIROUTE_API_KEY` (OmniRoute is **retired/local-only**; key not in Supabase env) → in production it either errors or falls back to **canned arrays** (`content_recommendations: ["new pages / products / automations…"]`).
- **Why it's fake:** It's a dead provider + canned fallback masquerading as "AI Business Partner analysis of live data."
- **User risk:** Same as #2 — "AI" panel serving template sentences.
- **Action:** **[REBUILD]** — point `recommend` at the same Central AI Brain (Gemini-direct backend route) or remove the panel.

### 6. Dashboard AI provider chain
- **Location:** `dashboard/src/lib/aiProvider.js`
- **Current state:** Chain = Gemini (needs `VITE_GEMINI_API_KEY` — **not set** in dashboard Vercel env) → OmniRoute (needs `VITE_OMNIROUTE_BASE_URL` — not set, provider retired) → backend `hermes.chat` — **an action that does not exist** in the backend's allowlist (`hermes.agent` does; `hermes.chat` doesn't).
- **Why it's fake:** All three legs are dead in production. Anything imported from `aiProvider` silently fails.
- **User risk:** Feature appears, then does nothing / errors.
- **Action:** **[DELETE]** the broken chain; route all dashboard AI through the working `hermes.agent`/Brain endpoint.

## TIER 3 — Misleading metrics & phantom capabilities

### 7. `revenue.snapshot` zeros
- **Location:** `api/index.js` L2372
- **Current state:** `audits`, `affiliateClicks`, `productPurchases`, `gumroadSales` all read tables that (a) await an **unapplied migration** (`audit_reports`, `affiliate_clicks`, `product_purchases`) or (b) **nothing writes to** (`gumroad_sales` — no Gumroad webhook exists). `safe()` swallows the misses and reports 0.
- **Why it's fake:** "0" means "can't measure," not "zero happened." The panel shows a false zero while real Gumroad sales (if any) are invisible.
- **User risk:** Decisions made on phantom-zero dashboards.
- **Action:** **[REBUILD]** — apply the migration + add the Gumroad webhook; until then label the panel "no data yet," don't show 0s.

### 8. GA card "goal conversions"
- **Location:** `api/index.js` GA block (~L912): `goalConversions: newUsers30d`
- **Current state:** New users is **renamed** "goal conversions."
- **Why it's fake:** A proxy metric wearing a conversion's name — an owner who acts on it is acting on the wrong number.
- **User risk:** Misread KPIs.
- **Action:** **[REBUILD]** — rename to `newUsers30d` (one line) or wire real conversion events.

### 9. Product price & account drift
- **Location:** `StorePage.jsx` ($27) vs `config/gumroad.js` ($49); two Gumroad accounts (`francescaonline`, `lavignefrancesca`)
- **Current state:** Dashboard advertises $27; config says $49; products scattered across two storefront accounts.
- **Why it's fake:** Three "truths" about the same product.
- **User risk:** Buyer sees $27, checkout says $49 → trust death at the exact moment of sale.
- **Action:** **[REBUILD]** — one price, one account, single source of truth in `gumroad.js`.

### 10. "Public site"
- **Location:** `App.jsx` `PUBLIC_SITE = <DBO Gumroad URL>`; `isDashboardDomain` still lists retired `dashboard.digitallydefined.online`
- **Current state:** The "public funnel" is a raw checkout URL; a retired domain still in domain logic.
- **Why it's fake:** There is no public marketing site — a constant pretending otherwise.
- **User risk:** N/A directly; code-rot risk.
- **Action:** **[DELETE]** the constant + the `.online` domain check; build the public `/` (V1).

### 11. Newsletter / subscribe
- **Location:** `NewsletterSignup.jsx` → Supabase edge fn `subscribe`
- **Current state:** The `subscribe` function **does not exist** in the canonical Supabase tree → the signup box always errors.
- **Why it's fake:** A capture box wired to a function that isn't there.
- **User risk:** Funnel asset quietly collecting nothing.
- **Action:** **[REBUILD]** — point at `lead.capture` (exists, works, dedupes) or ship the function.

## TIER 4 — Illusions of scale
### 12. `digital-products` "9 live & monetizable products"
- **Location:** `digital-products/README.md` manifest
- **Current state:** Local-only app (not in the Vercel team, no deployment); the "live" claim exists only inside its own docs; product state lives in Puter Cloud folders, not in a purchasable storefront.
- **Why it's fake:** "Live" ≠ reachable by a customer. None of the 9 are buyable today.
- **User risk:** Planning around products that don't exist for buyers.
- **Action:** **[DEFER]** the whole app; **[KEEP]** only if a single product (DBO) gets deployed + Gumroad-linked.

### 13. Onboarding "steps"
- **Location:** `OnboardingPage.jsx` — "Content coming soon." on every step
- **Action:** **[HIDE]** until real onboarding exists (V1: onboarding = the quiz itself).

## WHAT IS GENUINELY REAL (don't throw these away)
| Thing | Proof it's real |
|---|---|
| Quiz scoring + static roadmap | pure functions, live, no deps |
| `quiz.submit` → Supabase `quiz_roadmaps` | 1 real lead in 30d |
| GA card (post-migration) | `connected:true`, fresh fetch, property `563506381` |
| `lead.capture` (Supabase upsert, honest Brevo status) | code is honest: reports `brevoAdded:false` when it fails |
| `affiliate.recommend` / `affiliate.click` | deterministic engine, real tables on migration |
| `product.purchase` PayPal | honest "not configured" — built, just uncredentialed |
| `hermes.agent` assistant | real Gemini-direct in prod (`GEMINI_API_KEY` set) |
| `integration.community` (current code) | already fixed to `connected: members!==null` — the *old* deploy returned a false `connected:true` (illusion retired in latest code) |

## FINAL ACTION SCORECARD
| # | Item | Verdict |
|---|---|---|
| 1 | `intelligence` literal | **[REBUILD]** (Brain) / **[HIDE]** meanwhile |
| 2 | `brain.brief` literal | **[DELETE]** |
| 3 | `automation.*` no-op panel | **[DELETE]** endpoints, **[HIDE]** tab |
| 4 | `asset.marketing` template-gen | **[REBUILD]** (1 Gemini call) or **[DELETE]** |
| 5 | Analytics `recommend` (dead OmniRoute) | **[REBUILD]** → Brain or remove panel |
| 6 | `aiProvider.js` dead chain | **[DELETE]** |
| 7 | `revenue.snapshot` phantom zeros | **[REBUILD]** (migration + Gumroad webhook + "no data" states) |
| 8 | GA "goal conversions" proxy | **[REBUILD]** rename to `newUsers` |
| 9 | DBO price/account drift | **[REBUILD]** single source of truth |
| 10 | `PUBLIC_SITE` + `.online` domain logic | **[DELETE]** |
| 11 | `subscribe` → missing edge fn | **[REBUILD]** → `lead.capture` |
| 12 | `digital-products` "9 live" | **[DEFER]**, keep only DBO path |
| 13 | Onboarding "coming soon" | **[HIDE]** |
| — | Quiz, `quiz.submit`, GA card, `lead.capture`, affiliate engine, PayPal (uncredentialed), `hermes.agent`, Facebook (fixed) | **[KEEP]** |
