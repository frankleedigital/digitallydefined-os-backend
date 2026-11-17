# DIGITALLYDEFINED ECOSYSTEM — MASTER AUDIT
**Date:** 2026-11-10 · **Mode:** REPORT ONLY (no files modified, no deploys) · **Auditor:** Hermes (Chief Architect / Product / Systems / Revenue / Tech Lead)
**Method:** Every claim below was traced in the actual `DigitallyDefinedClean` tree, the two live Vercel projects, and live API probes. Items I could not reach are marked **[UNVERIFIED]** — not assumed.

> Categories used throughout: **A** Working · **B** Partial · **C** Disconnected-but-built · **D** Placeholder · **E** Tech debt · **F** Legacy · **G** Revenue-ready

---

## 1. EXECUTIVE SUMMARY

You have **one live surface** — `dashboard.digitallydefined.agency` (Vercel) backed by one live API — `digitallydefined-os-backend.vercel.app` — plus a Supabase project doing real storage/AI. Everything else (`.online`, `.store`, `.agency` marketing, `francescalavigne.com`, the two duplicate backends, the digital-products storefront) is **down, on hold, retired, or local-only**.

The three things that are genuinely *working and revenue-relevant* right now:
1. **The quiz → static-persona-roadmap → email-capture funnel** (deterministic, no AI). Producing real leads (1 in the last 30 days per `revenue.snapshot`).
2. **The AI assistant** (`hermes.agent`), now routed through **Gemini direct** in the backend (OmniRoute retired).
3. **Gumroad checkouts** for three products ($0 / $17 / $27) — the only live "buy now" path in the whole system.

The three things that are **fake-looking but not real**:
1. The **Intelligence / AI Business Partner dashboard** — the live `intelligence` API action returns **hard-coded** "Builder" data (canned brief, canned market gaps). It looks live but has no AI behind it.
2. **In-app product purchase (PayPal)** — fully wired in code (`paypal.order` / `product.purchase`) but **no credentials configured** → nothing is purchasable in-app.
3. **The GA Integrations card** — points at a **deleted** GA property (`.online`), so it can never light up until re-pointed.

**True platform completion: ~35–40%** of the intended "automated revenue machine" (details in §14). The *lead-gen core* works; the *monetization core* is mostly placeholder.

### What belongs where (short answer, full map in §8)
- **Dashboard** (live): quiz, roadmap, user portal, analytics, AI assistant, integrations, growth, store shelf.
- **digitallydefined.agency** (ON HOLD, currently **down**): marketing, services, booking, funnels. *Nothing is deployed here today.*
- **digitallydefined.store** (ON HOLD, currently **down 522/525**): digital storefront (templates/courses/downloads/bundles). *Source has no GA; not currently serving.*
- **francescalavigne.com** (HOLD): personal brand. Not in scope.
- **digitallydefined.online** (RETIRED): domain expired → parking page; GA property deleted. **Do not touch.**

---

## 2. ECOSYSTEM MAP

### Applications (in the Clean tree)
| App | Type | State | Notes |
|---|---|---|---|
| `digitallydefined-dashboard` | React 18.3 + Vite 5 + React Router v7 SPA | **A LIVE** | Deployed on Vercel, custom domain `dashboard.digitallydefined.agency` |
| `digitallydefined-os-backend` | Node API on Vercel | **A LIVE** | ~60 allowed actions; Supabase + Gemini-direct + Brevo/Notion keys |
| `digitallydefined-os-workers` | Cloudflare Workers (wrangler.toml) | **B PARTIAL** | Built; live deploy **[UNVERIFIED]** |
| `digital-products` | React storefront launcher (Puter Cloud state) | **C LOCAL ONLY** | Not in the 2-project Vercel team → not deployed |
| `digitallydefined-backend-clean` | duplicate old backend | **F LEGACY** | `GA4_*` env, no Vercel link |
| `archive/digitallydefined-backend-clean` | archived dup | **F LEGACY** | stale `.vercel` link |

### Supabase (project `dijjlppdljpcgyoakdnq`, org SuperFran)
- **Live Edge Functions:** `hermes`, `backend-hermes`, `sellable`, `followup`, `post-publisher`, `sync`, `analytics`, `optimization-loop`, `optimization-loop-weekly`, `notion-sync`, `quiz-roadmap`, `quiz-submit`, `reputation`, `content`
- **Tables:** `quiz_roadmaps` (source of truth for quiz leads), `idea_intake` (Notion fallback), leads/audits/affiliate tables (revenue platform — **migration `20261110000000_revenue_platform.sql` NOT applied**).
- **Three `supabase/` trees exist:** root `supabase/` is **retired** (`.temp` renamed so it can't deploy); canonical live tree = `digitallydefined-os-backend/supabase/`.

### Vercel deployments (team `francescas-projects-be439d73`, **exactly 2 projects**)
| Project | URL | Live? |
|---|---|---|
| `digitallydefined-dashboard` | `dashboard.digitallydefined.agency` | ✅ 200 |
| `digitallydefined-os-backend` | `digitallydefined-os-backend.vercel.app` | ✅ status ok |

### Domains (live-check 2026-11-10)
| Domain | Role | Live check | Verdict |
|---|---|---|---|
| `dashboard.digitallydefined.agency` | Dashboard | 200 | **A LIVE** |
| `digitallydefined.agency` | Marketing (on hold) | 000 (Cloudflare, unreachable) | **C DOWN** |
| `digitallydefined.store` | Storefront (on hold) | 522/525 (Cloudflare, origin down) | **C DOWN** |
| `digitallydefined.online` | Retired | Namecheap parking page (domain expired) | **F RETIRED** |
| `francescalavigne.com` | Personal (hold) | not checked | **[UNVERIFIED]** |

---

## 3. PRODUCT INVENTORY

### Products displayed in the live dashboard Store (`/store`, static `PRODUCTS` array)
| Product | Price | Checkout | Status |
|---|---|---|---|
| Digital Business OS | **$27** (StorePage) vs **$49** (`gumroad.js` — price mismatch) | Gumroad `francescaonline.gumroad.com/l/digital-business-os` | **G REVENUE-READY** (external checkout live; store shelf + "Most popular" badge) |
| Annual Financial Dashboard | $17 | Gumroad `lavignefrancesca.gumroad.com/l/ycaru` (legacy account) | **G REVENUE-READY** (link works if listing is live **[UNVERIFIED]**) |
| Free Starter | $0 | Gumroad `lavignefrancesca.gumroad.com/l/noodsi` | **G lead magnet, live** |

### Products that exist in code but are NOT displayed on the right site
| Item | Where it lives | Where it *should* live | Issue |
|---|---|---|---|
| **Digital Superpower Quiz** | `/quiz` on the dashboard | Marketing site (`.agency`) as top-of-funnel | It's public on the dashboard, but the marketing site that should *drive* visitors to it is **down** → dead-end funnel |
| **Personalized Roadmap** | rendered on `/quiz/results` (static, persona-based) | deliverable inside quiz + emailed | Delivered on screen ✅; **email delivery broken** (Brevo down) |
| **Digital Business OS** | dashboard `/store` + Gumroad | `.store` storefront (on hold) | Shelf exists on dashboard; `.store` (its intended home) is down; `digital-products` app that renders the real product is **local-only, not deployed** |
| **Audit Services / Audits** | `audit.save` action + `revenue.snapshot.audits` (0 audits) | `.agency` service sales | No purchase UI, no checkout; audits count = 0 in prod |
| **Affiliate Recommendations** | `affiliate.recommend` / `affiliate.click` + `lib/affiliate.js` (10 programs: Ahrefs, SEMrush, SurferSEO, Hostinger, Cloudways, Namecheap, ConvertKit, GoHighLevel, Jasper, OpenRouter) with audit-signal→program mapping | post-audit upsell screen | Engine built + deployed; **0 clicks in 30 days**; no UI surface pushing it live |
| **Templates / Downloads / Bundles / Courses** | `digital-products` buckets: 9 "Live & Monetizable", 12 "Backend Microservices", 4 "Placeholders" (per its own README) | `.store` | **Local manifest only — not deployed anywhere** |
| **Membership components** | `premium.js`, `PremiumGate.jsx`, `license.verify` | dashboard | Built gate + license verification; **no membership product/price tier exists to gate behind** |
| **ROI Calculator** (`/thank-you-calculator`) | dashboard | post-purchase proof page | Works standalone, orphaned (no purchase feeds it since purchases are blocked) |

**Answer to "which products are on the wrong site":** the quiz + roadmap + DBO are on the *dashboard* (a user app), while their natural homes — the `.agency` marketing site and the `.store` storefront — are both **down**. Meanwhile the Gumroad storefront that actually sells DBO lives on a third domain. Net: every product is reachable from exactly one place (the dashboard), and the two sales/marketing sites that should carry them are offline.

### Checkout systems that exist
1. **Gumroad** (external, 3 products) — the only checkout that can take money **today**.
2. **PayPal in-app** (`paypal.order` → `product.purchase` → `paypal.verify` → `paypal.webhook`) — code complete, **blocked: no `PAYPAL_CLIENT_ID`/`PAYPAL_SECRET`**.

---

## 4. FUNNEL INVENTORY

| Funnel | Path | Status |
|---|---|---|
| **Quiz funnel (primary, live)** | `/store` or `/` → `/quiz` → `/quiz/results` (roadmap shown first) → email capture below result → `quiz.submit` → Supabase `quiz_roadmaps` + Brevo email | **A WORKING** (email leg broken by Brevo — "best-effort" by design: visitor keeps the roadmap regardless) |
| **Lead re-hydration** | `quiz.roadmap.get?email=` (auth-gated) | Built, in prod |
| **Email nurture** | Brevo list (per-list revenue, campaigns) | **B BROKEN UPSTREAM** — `integration.email` → `{"connected":false,"error":"Brevo API request failed."}` |
| **GA attribution** | gtag `G-GQE8DZ15BL` on dashboard SPA (prod-verified in bundle) | **A LIVE** |
| **GA data card** | `integration.googleAnalytics` → service-account JWT → property `532506061` | **B BLOCKED** — property is **deleted/trashed** (see §5); card can never light up on this property |
| **In-app purchase funnel** | product shelf → `paypal.order` → verify → webhook | **B BUILT, BLOCKED** (no PayPal creds) |
| **Marketing-site funnels** (`.agency`: service sales, audit sales, booking) | none deployed | **D/ C — absent** (site down, no code in Clean tree) |
| **Social/community** | `integration.community` (Facebook) | `{"connected":true,"error":"Facebook API request failed."}` → effectively broken |

---

## 5. ANALYTICS INVENTORY (G-SQGCJN9WG3 audit)

Full detail in `GA_CLEANUP_PLAN.md` (written this session). Findings, updated with your "property deleted" fact:

1. **Deleted-property references still in flight:**
   - Vercel backend prod: `GA_MEASUREMENT_ID` + `GA_PROPERTY_ID` (= `532506061`, added today) + `GA_SA_KEY_B64` + `GA4_*` pair (19h old)
   - Vercel dashboard prod: `VITE_GA_MEASUREMENT_ID` (**60 days old**, inlined into the current bundle)
   - `digitallydefined-os-backend/.env` (L60-61 `GA4_*`, L134-135 `GA_*`), `digitallydefined-dashboard/.env` L48, both duplicate-backends' `.env` files
   - Code: `api/index.js` `fetchGa4Stats` (live), `integrations/config.js` + `google-analytics.js` (live card), dead legacy `integrationsDispatch.js` / `src/config/env.js`
2. **`.online` analytics references:** the domain is a **Namecheap parking page** ("Domain registration has expired" — verified in the served HTML). Its GA property is deleted/trashed per your note. `digitallydefined-online-local` source contains **zero** GA/GTM/UA code. No `UA-` or `GTM-` IDs exist anywhere in either tree.
3. **Do dashboard analytics cards use G-GQE8DZ15BL?** **Split:** *browser tracking* = yes, `G-GQE8DZ15BL` (prod-verified inlined). *API data cards* = **no** — they still read property `532506061` (the deleted one). So the dashboard's own traffic (G-GQE8DZ15BL) is **invisible to its own analytics card**.
4. **Is the GA4 service account properly integrated?** The JWT/OAuth2 pipeline is built, deployed, and proven (token exchange works). It was blocked on property sharing — and that blocker is now moot for `532506061` because **the property no longer exists**.
5. **Is the analytics integration fully functional?** No. The card is functionally dead until re-pointed at a *live* property — i.e., the property behind `G-GQE8DZ15BL`.

**Cleanup plan (no changes made):**
- **Phase 1 (zero-risk, do first):** delete `GA4_*` from both duplicate `.env`s; delete empty `GA_API_KEY`/`GA_SA_KEY` from `os-backend/.env`; drop the stale `.vercel` link in the archived dup.
- **Phase 2 (the one decision you owe):** confirm `G-GQE8DZ15BL`'s property in GA Admin → share THAT property with the service account (`digitallydefined-ga4-service-a@…`) → swap `GA_PROPERTY_ID`/`GA_MEASUREMENT_ID` (backend .env + Vercel, dashboard .env + Vercel `VITE_GA_PROPERTY_ID`/`VITE_GA_MEASUREMENT_ID`) → redeploy → card lights up with real dashboard traffic.
- **Phase 3:** delete dead `integrationsDispatch.js` + `src/config/env.js` GA block; fix old `.env.example` docs; decide `.online` (confirmed retired — no action beyond leaving it).

---

## 6. DIGITAL SUPERPOWER QUIZ — FLOW MAP

**Trace (verified in code):**

```
/quiz (QuizPage)                      [A LIVE, public, no auth]
  └─ 5 questions × 5 options, each option tags one of 5 personas
     (builder / educator / strategist / creator / connector)   [lib/quiz/questions.js]
  └─ answers kept in component state → localStorage ("dd-quiz-results")
/quiz/results (QuizResultsPage)
  └─ deterministic score: persona = most-chosen archetype;
     confidence = topCount/answered            [lib/quiz/scoring.js — pure, no AI]
  └─ RESULT SHOWN FIRST on screen: static roadmap from [lib/quiz/personas.js]
     (3 roadmapSteps + recommendedPathways + first step + tool prefs)
  └─ email capture BELOW result (best-effort)
     └─ api.post("quiz.submit", {answers, persona, name, email, source, mode:"freeMode"})
          └─ backend /api → quizDispatch.js
               ├─ writes Supabase quiz_roadmaps (source of truth)      [A]
               ├─ fires roadmap email via Brevo   (buildRoadmapEmail)  [B — Brevo down]
               └─ logs persona + HAS_ROADMAP flags
quiz.roadmap.get?email= (auth-gated)  [A]  → re-hydrates a saved roadmap for the .agency/.store site
```

**Your specific questions, answered:**
- *Was personalized roadmap generation already built?* **Yes — but it is *persona*-personalized, not AI-personalized.** The "personalization" is a deterministic archetype lookup (5 static roadmaps), not a generated one.
- *Is it functional?* **Yes** — the roadmap renders on `/quiz/results` with zero backend dependency (survives even if everything else is down).
- *Is it hidden?* **No** — it's the first thing on the result screen.
- *Is it disconnected?* **No** — `quiz.submit` is live in prod; leads are landing in `quiz_roadmaps` (1 lead last 30 days).
- *Is it AI-dependent?* **No.** Scoring and roadmap are pure functions.
- *Is it blocked by a missing integration?* Only the **email leg** is blocked (Brevo 401/decryption upstream). The visitor experience is complete without it.

**The *AI* "business partner" roadmap (a different thing, `/intelligence` + `intelligence` action)** is the piece that is **not real**: the handler in `api/index.js` returns hard-coded "Builder" superpower, canned 30-60-day roadmap, and a fake `brain.brief` (generatedAt fixed at "2026-05-25"). The Intelligence Dashboard UI (`IntelligenceDashboard.jsx` + `RoadmapView.jsx` etc.) is fully built and polished — it just displays static data. Category: **D PLACEHOLDER with A-looking UI**.

---

## 7. USER JOURNEY — WHAT HAPPENS NOW vs WHAT SHOULD HAPPEN

**Current reality (visitor path):**
```
Visitor (only entry: dashboard.digitallydefined.agency — the marketing sites are DOWN)
 ↓
Home "/"  →  CTA to quiz
 ↓
/quiz (5 questions, no login)
 ↓
/quiz/results  →  roadmap on screen (WORKS, instant)
 ↓
email capture (optional) → quiz.submit → Supabase ✅ / Brevo email ❌
 ↓
…dead end…
- If they have a logged-in account: /dashboard (Growth/Integrations/Notion tabs), /intelligence (fake AI partner), /assistant (real AI), /store (3 Gumroad products)
- Store purchase → Gumroad (leaves the ecosystem, no in-app purchase possible)
- /store shows "quiz → email → segmented offer" — the "segmented offer" step does not exist yet
```
**What should happen (target):** marketing site (`.agency`) drives traffic → quiz → roadmap + email → *segmented offer by persona* → in-app or Gumroad purchase → automated delivery → AI partner dashboard with real intelligence → audit upsell → affiliate recommendations → recurring.
**Broken/missing:** (1) no live traffic source (both marketing/store sites down), (2) no persona-segmented offer step, (3) email nurture dead, (4) in-app checkout blocked, (5) the AI "partner" dashboard shows fake data.
**Dead ends:** post-quiz (no next step besides email), post-store-browse (no in-app buy), `/thank-you-calculator` (orphaned), `/intelligence` (placeholder content).

---

## 8. REVENUE AUDIT

**Can make money today (HIGH):**
- **Gumroad — 3 products live externally.** DBO $27, Annual Financial Dashboard $17, Free Starter $0. No credentials needed; Gumroad handles payment + delivery. The dashboard `/store` already links out. **This is your "first sale" path.**

**Could make money with minor fixes (MEDIUM):**
- **Affiliate engine** (`lib/affiliate.js` + `affiliate.recommend`/`affiliate.click`): 10 programs, audit-signal→program mapping, deployed. Needs (a) a UI surface that actually shows recommendations post-audit/post-quiz and (b) real affiliate links (currently slugs only). 0 clicks in 30 days = no traffic reaching it.
- **Fix Brevo** → the quiz email leg + nurture sequence starts converting the 1-lead/30d trickle into sales.
- **Re-point the GA card** (Phase 2 above) so you can actually see which traffic converts.
- **Apply the revenue-platform SQL migration** (`20261110000000_revenue_platform.sql`) so `audit_reports` / `affiliate_programs` tables exist.

**Revenue systems that exist (code):** `lead.capture`, `revenue.snapshot` (live, real: 1 lead, $0), `audit.save`, `affiliate.*`, `product.purchase` + PayPal flow (built, uncredentialed), `digital-products` catalog manifest (local).

**Ranks:**
| # | Opportunity | Rank |
|---|---|---|
| 1 | Confirm/fix the 3 Gumroad listings + price mismatch ($27 vs $49) and drive quiz→DBO upsell | **HIGH** |
| 2 | Fix Brevo (email leg of every funnel) | **HIGH** |
| 3 | Point quiz result at a persona-segmented offer (use the 5 personas already scored) | **HIGH** |
| 4 | Affiliate UI surface post-audit + real affiliate links | **MEDIUM** |
| 5 | PayPal in-app purchase (add creds) | **MEDIUM** |
| 6 | Apply revenue SQL migration (audits/affiliate tables) | **MEDIUM** |
| 7 | Bring `.agency` marketing site online (traffic engine for all of the above) | **MEDIUM** (big effort) |
| 8 | Replace the fake `intelligence` output with real Gemini-generated roadmaps | **MEDIUM** |
| 9 | Deploy the `digital-products` storefront (`.store`) with its 9 live products | **LOW–MEDIUM** |
| 10 | Membership tier behind the existing `PremiumGate` | **LOW** |

---

## 9. AI SYSTEM AUDIT (Gemini/Vertex now preferred)

| Feature | Provider actually used | Works? | Notes |
|---|---|---|---|
| Quiz scoring + roadmap | **None** (deterministic) | **A** | Zero AI — by design |
| AI Assistant (`/assistant`, `hermes.agent`) | **Gemini direct** in backend (`GEMINI_API_KEY` + `GEMINI_MODEL` in Vercel; `OMNIROUTE_DISABLED` set 2d ago) | **A (likely)** | `hermes.agent` is allowed + handled; the frontend `aiProvider.js` fallback `hermes.chat` is NOT an allowed action (minor dead-end in that chain only) |
| Intelligence / AI Business Partner (`/intelligence`) | **NONE — hard-coded response** | **D PLACEHOLDER** | UI is real, data is canned "Builder" + fixed brief |
| Frontend `aiProvider.js` chain (Gemini→OmniRoute→backend) | Broken in prod: dashboard has **no `VITE_GEMINI_API_KEY` / `VITE_OMNIROUTE_*` in Vercel env**; last fallback uses non-allowed `hermes.chat` | **C DISCONNECTED** | Anything importing `aiChat` is dark |
| Roadmap generation (AI version) | — | **B NOT BUILT** | Only the static persona version exists |
| Content generation (`post-publisher`, `followup`) | Supabase edge fns (model **[UNVERIFIED]**) | **B** | Deployed; runtime behavior not probed |
| OmniRoute | **Retired everywhere** (local-only, never a Vercel path) | **F** | Dashboard `OMNIROUTE_*` fallbacks are vestigial |

**Bottom line:** one AI path is genuinely production (backend-routed Gemini for the assistant). The AI *business partner* is a placeholder wearing a polished UI. Anything relying on dashboard-side `VITE_GEMINI_API_KEY`/OmniRoute is disconnected.

---

## 10. RECOMMENDED ECOSYSTEM STRUCTURE (where every asset belongs)

**`dashboard.digitallydefined.agency` (the only live product today — keep as the app):**
tools (ROI calculator, audits), quiz (public entry), roadmap (result deliverable), user portal (auth, onboarding/intake/review), analytics (re-point GA card to live property), AI assistant (keep), integrations (fix Brevo/GA, archive Facebook), store shelf (3 Gumroad products).

**`digitallydefined.agency` (marketing — ON HOLD → to be rebuilt, not the dashboard):**
services + audit offers, service sales, funnels (quiz → email → offer), booking. *Currently: nothing deployed. Recommend building as a static/Next marketing site that pushes all traffic to the dashboard quiz.*

**`digitallydefined.store` (digital storefront — ON HOLD):**
templates, downloads, courses, bundles. The `digital-products` app is the right home; deploy it here and wire Gumroad (or in-app PayPal once credentialed) for delivery.

**`francescalavigne.com` (personal brand — HOLD):** personal content/blog; link out to the business funnels; no revenue systems.

**`.online` (RETIRED):** leave parked/expired; delete its residual env vars per §5 Phase 1–3.

---

## 11. TECH DEBT INVENTORY
1. Two duplicate backends (`digitallydefined-backend-clean` + archived) with stale `GA4_*` envs and dead `integrationsDispatch` code — delete/archive.
2. Three `supabase/` trees; root one retired, one canonical — enforce single source.
3. `api/index.js` is a ~2,600-line god-file with ~60 actions + hard-coded `intelligence`/`brain.brief` placeholder payloads.
4. `aiProvider.js` references a non-allowed `hermes.chat` action and env vars that don't exist in the dashboard's Vercel.
5. `StorePage` price ($27) disagrees with `gumroad.js` ($49); DBO lives on a different Gumroad account than the other two products.
6. Root workspace litter: ~40 `*_*.md` audit/report files, `_*.py/_*.txt` scratch, `scratch_storage.sqlite` (41 MB), `models.json` (2 MB), `.tmp-gw.log` — cleanup candidates.
7. `fastapi.*` actions map to a FastAPI microservice (docker-compose) — whether that service runs anywhere in prod **[UNVERIFIED]**.
8. Empty `GA_API_KEY`/`GA_SA_KEY` env entries; dead `GA4_*` in dups.

## 12. LEGACY CLEANUP RECOMMENDATIONS (prioritized, no action taken)
1. **Phase 1 (zero-risk):** strip `GA4_*` from duplicate `.env`s, drop empty GA vars, remove archived dup's `.vercel` link. *(~15 min, no behavior change.)*
2. **Phase 2 (decision-gated):** re-point the GA card to `G-GQE8DZ15BL`'s live property (share with SA) OR retire the GA card entirely; remove `532506061`/`G-SQGCJN9WG3` everywhere.
3. Delete `integrationsDispatch.js` + `src/config/env.js` GA block (verified unreachable in prod).
4. Consolidate supabase trees to the canonical `digitallydefined-os-backend/supabase/`.
5. Retire duplicate backends to `archive/` (or delete).
6. Confirm-and-document OmniRoute retirement; remove vestigial dashboard OmniRoute fallbacks.
7. Domain policy: renew/retire `.online` (retire), decide `.store`/`.agency` (rebuild on hold).

---

**Top 10 cleanup priorities (ranked):**
1. Retire/delete the two duplicate backends + their stale `GA4_*` envs (zero-risk, removes confusion about which backend is real).
2. Re-point the GA card to a live property (or retire the card) — kills all `532506061` references.
3. Delete dead `integrationsDispatch.js` + `src/config/env.js` GA block.
4. Consolidate the three `supabase/` trees to the canonical one.
5. Remove dashboard vestigial OmniRoute fallbacks + fix the `hermes.chat` dead-end in `aiProvider.js`.
6. Unify the DBO price ($27 vs $49) and Gumroad account (two accounts currently).
7. Replace the hard-coded `intelligence`/`brain.brief` placeholders with real Gemini output (or hide the tab).
8. Purge root scratch litter (`_*.py`, `scratch_storage.sqlite`, 2 MB `models.json`, ~40 stale audit .md files, `.tmp-gw.*`).
9. Fix `StorePage`/`gumroad.js` config drift + orphaned `/thank-you-calculator`.
10. Enforce the domain policy in docs: `.online` retired, `.agency`/`.store` on hold — stop any code referencing `.online`.

## 13. TOP 10 REVENUE OPPORTUNITIES (ranked)
1. **Fix the 3 live Gumroad listings + unify the DBO price ($27 vs $49)** — money can move today.
2. **Add the persona-segmented offer step at `/quiz/results`** (route each of 5 personas to its best-fit product/price).
3. **Fix Brevo** so quiz email + nurture actually deliver (the whole lead→sale loop depends on it).
4. **Surface the affiliate engine** (post-audit recommendation UI + real affiliate links) — 10 programs already mapped.
5. **Apply the revenue SQL migration** so audits/affiliate/clicks persist and show in `revenue.snapshot`.
6. **Add PayPal credentials** to make in-app `product.purchase` real (removes the Gumroad-only dependency).
7. **Bring `.agency` online** as the traffic engine (without it, everything else starves).
8. **Replace the fake `intelligence` output** with real Gemini roadmaps (turns a placeholder into a premium upsell).
9. **Deploy the `digital-products` storefront** (9 live products) to `.store`.
10. **Stand up a membership tier** behind the existing `PremiumGate`/`license.verify` for recurring revenue.

## 14. FASTEST PATH TO FIRST SALE
**~1–2 hours, no new infrastructure:**
1. Open `francescaonline.gumroad.com` + `lavignefrancesca.gumroad.com`; confirm all 3 listings are **public & priced** (fix the DBO $27/$49 mismatch on the dashboard to match Gumroad).
2. At `/quiz/results`, after the roadmap, add a single CTA card: *"Put this plan into motion — grab the Digital Business OS ($27)."* (persona-aware copy is a fast follow).
3. Drive 10 real visitors to the quiz (LinkedIn/DMs to your Gen X women network — no paid traffic needed).
4. First sale = a visitor who completes quiz → clicks Gumroad → pays. Gumroad handles payment, delivery, and (optionally) a payout to you.
**Contingency:** if Gumroad listings are stale, the fastest alternative is the $0 "Free Starter" as the tripwire + a manual PayPal invoice for DBO (PayPal creds still needed for full automation).

---

## 15. TRUE PLATFORM COMPLETION PERCENTAGE

Weighted by your stated mission (lead-gen → roadmap → product → affiliate → recurring, automated):

| Pillar | State | Weight | Score |
|---|---|---|---|
| Lead capture (quiz + storage) | A (working) | 20 | 20 |
| Personalized roadmap | A static / D AI-version | 15 | 8 |
| Monetization (checkout) | G Gumroad (ext) / B PayPal (blocked) | 25 | 12 |
| Affiliate engine | B built, no traffic/UI | 10 | 3 |
| Email nurture | B broken (Brevo) | 10 | 2 |
| Traffic/marketing site | C down | 10 | 1 |
| Analytics visibility | B blocked (deleted property) | 5 | 1 |
| Recurring/membership | D placeholder | 5 | 1 |
| **TOTAL** | | **100** | **≈ 48 / 100** |

**Honest read: ~40–50% complete.** The *acquisition* half (quiz→lead→roadmap) is solid and live. The *monetization + nurture + traffic* half is where the machine isn't running yet: checkout is external-only, email is broken, marketing sites are down, and the AI partner is a placeholder. **The two highest-leverage moves are (1) make the Gumroad + quiz→offer link airtight for first sale, and (2) fix Brevo** — everything else is downstream of those.

---
*Report only. No files modified, nothing deployed. Companion docs: `GA_CLEANUP_PLAN.md`, `REVENUE_PLATFORM_ROADMAP.md` (this tree).*
