# THE MONEY STACK — Ideal Customer Journey (existing assets only)
**2026-11-10 · No new products. Every step uses something already owned + one piece of wiring that already half-exists.**

## THE STACK (price ladder from the actual shelf)
```
FREE      4 magnets: Niche Audit (xlsx) · Local SEO Checklist · 5 Estate Docs · 96h Scam Plan
$0→$17    First purchase: Digital Property Starter Kit · 90-Days PDF (once exported)
$27       DBO storefront entry (already live) · 50 AI Prompts · Trigger Word Bank
$37-47    Mid: Digital Landlord (merged) · High-Ticket Affiliate Guide · Intent to Income · Keyword Suite
$97-197   Premium: Digital Fortress Blueprint · RETIREMENT MASTERY 2-in-1 · Digital Business OS
$29-99/mo Recurring (post-proof): AI Business Partner sub · Growth OS (Analytics)
Affiliate 10 engine programs + 36 CSV programs: Canva 20% recurring · Jasper 50% first month · Ahrefs/SEMrush one-time · GoHighLevel etc.
```

## JOURNEY (visitor → LTV)
```
VISITOR (public "/" funnel: value prop + quiz CTA + $27 DBO card)          [wiring: 1 route change]
   ↓
QUIZ /quiz (5 questions → persona)                                          [exists, live]
   ↓
RESULT /quiz/results
   • AI roadmap (Central AI Brain — reuses live hermes.agent; static persona roadmap as fallback)   [build: brain endpoint]
   • PERSONA OFFER CARD: lead magnet (free, email-gated via existing lead.capture)                  [wiring: 1 card]
   • FIRST PURCHASE: persona's "best first purchase" (Starter Kit / 50 Prompts / Snapshot…)         [wiring: 1 CTA]
   ↓
EMAIL (Brevo — fix pending)
   Day 0: roadmap + magnet delivered (existing quiz-submit email template, already written)
   Day 3: upsell = persona's "best upsell" (existing asset, no new content)
   Day 7: high-ticket = persona's "best high-ticket" + Strategic Launch Roadmap PDF as proof
   Weekly: "one move a week" (the newsletter promise) — content from the 50-prompts pack / guides (repurpose, don't create)
   ↓
GUMROAD CHECKOUT ($0-$197, all listings: 3 live + 11 ready-to-list)        [wiring: webhook → gumroad_sales table (migration pending)]
   ↓
IN-APP /plan "Your Growth Plan" (logged-in)
   • AI brief (diagnosis + 3 moves + 1 action + 1 CTA)                      [build: ai.brief, 1 endpoint]
   • GA numbers (live card since migration)                                 [exists]
   • Affiliate match for their audit tags (engine, 10→36 programs)         [exists + CSV import]
   ↓
RECURRING: AI Business Partner sub ($29-99/mo) — the Brain's "weekly move" IS the sub value
   (license-gated via existing license.verify + premium.js)
   ↓
WHITE-LABEL (the vision's end-state): everything above is brand-agnostic already
   (dd-brand-tokens + tenant = one key swap; DBO ships to other Gen X women as their tool)
```

## WHY THIS STACK PAYS (economics of the existing shelf)
| Stage | Asset that does the work | Already |
|---|---|---|
| Free magnet | 4 finished magnets | ✅ all exist |
| $0-17 entry | Starter Kit ($17 **already listed on Gumroad**) | ✅ live |
| $27 DBO | **already live on Gumroad ($27, 200 today)** | ✅ |
| $37-197 | 11 ready-to-list PDFs/tools | ✅ finished, need listings |
| Recurring | AI partner + Growth OS | ⚠️ engine exists, packaging post-proof |
| Commission | 46 program records (10 code + 36 CSV) | ✅ data exists |

## MONEY-STACK RULES (keep it a stack, not a zoo)
1. **One persona, one path** — no visitor ever sees more than their ladder (magnet → first → upsell → high-ticket → sub).
2. **Everything free is already written** (guides/prompts/checklists) — email never needs new content.
3. **The only new code in the whole stack:** public `/` (route), persona offer card (component), `ai.brief` (endpoint), Gumroad webhook (handler), Brevo fix. That is it.
4. **Gumroad until $500/mo**, then switch delivery to R2 + `sellable` fn (both already built).

## FIRST-30-DAY SEQUENCE (consistent-sale path)
- **Day 0-2**: unify DBO price/account; list the 3 highest-fit $17-47 items (Starter Kit ✓ live, 50 Prompts, High-Ticket Affiliate Guide); fix `/` + offer card.
- **Day 3-7**: apply revenue migration + Gumroad webhook (first tracked sale is now visible in `revenue.snapshot` — killing the phantom-zero panel).
- **Day 7-14**: Brevo fixed → quiz emails + 3-step persona sequence go live.
- **Day 14-30**: `ai.brief` live on /plan; drive 20-30 real visitors (network, no ads) → target: 2-3 DBO/first-purchase sales + 1 tracked webhook + 1 sub trial.
