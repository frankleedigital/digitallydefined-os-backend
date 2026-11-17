# 90-DAY LISTING PLAN — Existing Assets Only
**Goal: a stranger can buy from DigitallyDefined every day by Day 30; consistent sales by Day 90.**
Constraint honored: **no new products.** Every SKU below is one of the 28 in `DIGITALLYDEFINED_PRODUCT_GRAPH.md`.
Channel: **Gumroad (2 live accounts → 1)** until >$500/mo, then R2 + `sellable` fn (both already built).

---

## WEEK 0 (Day 0-3) — Prerequisites (nothing sells on a broken rail)
| Day | Action | Products touched |
|---|---|---|
| 0 | Unify DBO: **one price ($27 entry SKU), one Gumroad account** (francescaonline); fix `gumroad.js` + StorePage + Vercel env | 001 |
| 1 | Apply revenue-platform SQL migration; add **Gumroad webhook → `gumroad_sales`**; verify `revenue.snapshot` shows real numbers | all |
| 2 | **Fix Brevo** (new token or swap provider) → quiz email leg + weekly playbook go live | funnel |
| 2 | Public `/` funnel home (quiz CTA + DBO card) on dashboard domain; **persona offer card** at `/quiz/results` (one CTA per the 5 quiz personas, using the map) | funnel |
| 3 | De-dupe pass: merge **Digital Landlord 5-files → 1 offer (017)**, delete `Digital Deeds` dup (019), delete `Automated Asset Engine` root dup (016), delete `Breaking the Code` + `ai-realtor-mvp` from the shelf | 017, 019, 016 |

**Gate:** by end of Day 3, a cold visitor: `/` → quiz → persona card → live Gumroad SKU, with the purchase tracked in `gumroad_sales`.

## WEEK 1-4 (Day 4-30) — "READY NOW" TIER: list the 12 (10min-work each)
| Days | List | SKU | Price |
|---|---|---|---|
| 4-5 | RETIREMENT MASTERY (combine 2 parts) | 002 | $47-67 |
| 5 | 50 AI PROMPTS (PDF) | 008 | $17-27 |
| 6 | HIGH-DEMAND/LOW-SUPPLY PROMPTS | 009 | $27-47 |
| 6 | HIGH-TICKET AFFILIATE guide + **Affiliate Starter Kit** (compile 36-program CSVs + apply-doc) | 007 | $27-47 |
| 7 | DIGITAL EMPIRE flagship | 004 | $27-49 |
| 7 | RANK & RENT guide | 003 | $27-47 |
| 8 | DIGITAL FORTRESS | 005 | $47-97 |
| 8 | KEYWORD SUITE (3-in-1 zip) | 010 | $27-37 |
| 9 | STAFF/TOOLS PACK (zip 6 micro-tools + one-pagers) | 028 | $37-47 |
| 9 | AI-AGENT SETUP PLAYBOOK | 025 | $27-47 |
| 10 | LEGACY BUILDING for solo women | 022 | $17-27 |
| 10 | CONSULTANT guide | 024 | $17-27 |
| 11 | GATE the 4 free magnets (email via `lead.capture`): Local SEO checklist (011 already $0-listed), Niche Audit xlsx (012), 5 Estate Docs (020), 96h Scam Plan (021) | 011-021 | free |

**Day 14:** import the **36 affiliate CSV programs** into the `affiliate_programs` table (merge with the 10 in the engine) so `affiliate.recommend` serves all 46.
**Day 21:** list Catch-Up OS (013, after 90%→100% QA) at $27-47; Digital Wealth Snapshot (014) free-snapshot→paid tier ($29-77); Intent to Income (015) at $47-97; Automated Asset Engine (016) $37-77 (typo fixed).
**Day 30 check:** 18+ live SKUs, all persona paths reachable, all purchases tracked. Target: **5-10 tracked sales** (DBO + $17-47 tier) via quiz + direct links to your network.

## WEEK 5-8 (Day 31-60) — BUNDLES + AI LAYER
| Days | Action | SKUs |
|---|---|---|
| 31-35 | Ship the 6 bundle families from the Product Graph (Retirement Suite, R&R Ladder, Empire/Faceless Suite, Prompt Suite, Legal Protection Bundle, SOP/Agency Library) — each = zip of already-listed SKUs + one sales page | 002, 003, 004, 008, 009, 019, 020, 021, 023, 026, 027 |
| 36-42 | **Wire `ai.brief`** (expose the real `intelligencePipeline.js`) + "Your Growth Plan" screen; static roadmap as fallback | brain |
| 43-48 | Export 2× .gdoc → PDF ("90 Days to Financial Peace", "Gen X Superpowers Unlocked") and list at $17-27 | +2 SKUs |
| 49-55 | Faceless Suite (023) list; PRD Blueprints Pack (027) compile + list $47-97; SOP (026) list | 023, 026, 027 |
| 56-60 | 2× .gdoc done; **email sequence live for every persona** (3-step: magnet → first purchase → upsell, content from the already-written guides) | all |

**Day 60 check:** 30+ SKUs (28 core + bundles + 2 new PDFs), every buyer gets a 3-email persona sequence, AI Growth Plan live. Target: **25-40 cumulative tracked sales**, 1-2 affiliate clicks/day, list ~100 gated leads.

## WEEK 9-13 (Day 61-90) — RECURRING + WHITE-LABEL PREP
| Days | Action |
|---|---|
| 61-70 | Package **AI Business Partner subscription** ($29-99/mo) = the Brain's "weekly move" + roadmap; license via existing `license.verify`/`premium.js`; sell with **DBO full tier ($97-197)** as the one-time alternative |
| 71-80 | **Growth OS tier** ($19-49/mo): live GA numbers + `ai.brief` + analytics (all working now); Reputation Command Center stays B2B-only (deferred) |
| 81-90 | White-label prep: tenant/brand key over `dd-brand-tokens`; first **3 external beta tenants** (your Gen X women network) on Growth OS; measure churn signals |

**Day 90 targets:** 60+ cumulative tracked sales; ≥3 active subscriptions; 1 paid beta tenant; affiliate line producing first commissions (Canva/Jasper recurring = the "consistent" proof).

## RISK CHECKS (existing-asset honesty)
- **DBO (001)** lives in Notion (8 DBs, key 401) — if the $97-197 tier ships, verify the Notion workspace first (1 half-day) or sell the PDF+checklist version and mark the Notion tier "coming soon" (do NOT promise it).
- **36-program CSVs (018/007)**: commissions are program-published values — verify current rates at listing time (the engine already warns on this).
- **`gumroad_sales` tracking**: if Gumroad webhooks lag, fall back to manual entry into `gumroad_sales` for the first week so `revenue.snapshot` is never phantom again.
- Nothing in this plan requires the retired domains, OmniRoute, or the dead `subscribe` function — all paths use `lead.capture` + existing Gumroad.

## THE MATH OF "FIRST CONSISTENT SALE"
- Consistency = the *path* works for buyer #2: `/` → quiz → card → Gumroad → tracked row → Brevo email.
- **Day 10 exit criteria:** 2 tracked Gumroad sales from 2 different strangers. That is the green light to spend Week 5+ on bundles; if not, the only two levers are (a) more real visitors (network/DMs — no ads in 90d) and (b) move the DBO card earlier (quiz result → before email capture).
