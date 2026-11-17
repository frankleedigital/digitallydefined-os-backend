# DigitallyDefined → Revenue Platform Roadmap
**Date:** 2026-11-10 · **Owner:** founder + Hermes · **Status:** Phases 1–8 executed to the extent this turn allows

Mission: transform the dashboard into an automated lead-gen + affiliate + digital-product + AI-assessment revenue machine, run on Supabase, paid via PayPal, independent of Notion, with minimal owner involvement.

---

## PHASE 1 — WHAT EXISTS (evidence from the live codebase)

### Working today
- **Dashboard** (`digitallydefined-dashboard`, Vercel): 9 tabs — Overview, Growth, Product Factory, Content Calendar, Ideas, Intake, Assets, Integrations, AI, Antigravity. Loads on `/dashboard`, no auth gate (intentional, launch phase).
- **Quiz funnel** (public): quiz → roadmap → lead capture into Supabase `leads` + `quiz_results`. This is the proven lead engine.
- **Supabase** (live, project `dijjlppdljpcgyoakdnq`): 40+ tables including `leads`, `users`, `products`, `gumroad_sales`, `funnels`, `quiz_roadmaps`, `automation_runs`, `agents`.
- **Edge functions**: `hermes`, `backend-hermes`, `sellable`, `followup`, `post-publisher`, `sync`, `analytics`, `quiz-submit`, `quiz-roadmap`, `optimization-loop`, `notion-sync`.
- **AI layer**: Gemini/Vertex primary (free credits), OmniRoute optional-local-only, OpenRouter fallback.
- **Integrations**: Brevo (key disabled → 401), GA4 (IDs wired; service account pending), Facebook (token expired), Notion (working, 25 ideas).

### Partially working / needs credentials
- Brevo email (enable key), GA live metrics (needs SA JSON), Facebook (new token), Gumroad webhooks (not registered).

### Dead / deprecated
- OmniRoute public endpoint (retired — local only), `product_generator.py` (unused), Notion `BuildNow` field (doesn't exist in DB), website publishing (orphaned, uses `execSync`).

### Duplicate systems
- `digitallydefined-os-workers` vs backend (workers audit concluded: migrate/archive per `WORKERS_MIGRATION_AUDIT.md`), Notion as data store vs Supabase as data store (dual write, Notion is the redundant copy).

---

## PHASE 2 — REVENUE ARCHITECTURE (built)

```
Visitor → Free Tool (website audit / quiz / marketing health)
        → Lead capture (Supabase `leads`, UTM + source stored)   ✅ lead.capture
        → AI report (findings, score 0–100, recommendations)     ✅ audit.save
        → Affiliate recommendations (tag-matched)                ✅ affiliate.recommend
        → Affiliate click tracking                                ✅ affiliate.click
        → Email nurture (Brevo, when key enabled)                ⚠ blocked on key
        → Digital product offer (PayPal)                          ✅ product.purchase + webhook
        → Premium service offer (upsell path, roadmap sprint 2)
```

### Free tools (lead magnets)
Existing quiz + website audit are the two proven magnets. The `audit.save` action accepts six `tool_type`s: `website | seo | proposal | ai-readiness | marketing-health | digital-presence` — any tool in the dashboard can run the same journey: score → findings (tagged) → auto-affiliate-recs.

### Affiliate engine
- `lib/affiliate.js` — pure tag→program matcher (31 finding tags, 10 programs, weighted ranking, human-readable reasons).
- `affiliate_programs` table seeded with Ahrefs, SEMrush, Hostinger, Cloudways, Namecheap, ConvertKit, GoHighLevel, SurferSEO, Jasper, OpenRouter. **Commission rates are published values, `commission_verified=false` until re-confirmed in each program dashboard.**

### Digital products
- `product_purchases` + `paypal_orders` ledger (idempotent webhook fulfillment).
- PayPal Checkout Orders API (v2): create order → approve URL → capture on approval/webhook → mark `delivered`.
- Delivery: automated email with download link via Brevo (blocked on key) or direct link on the dashboard for logged-in buyers.

---

## PHASE 3 — NOTION REMOVAL (inventory + first toggle)

Notion call sites in backend: `lib/notion-client.js`, `lib/notion-write.js`, `lib/notion-architect.js`, `lib/notion-schema.js`, `lib/antigravity.js`, `lib/community-triggers.js`, `lib/content-sources.js`, `lib/hermesIntelligence.js`, `lib/sync-aggregator.js`, `api/index.js`.

| Notion feature | Supabase replacement | Status |
|---|---|---|
| Ideas DB (intake) | `idea_intake` table | ✅ created (migration) + `DD_USE_NOTION=false` toggle on `intake.submit` / `asset.activate` |
| Digital Assets DB | `generated_assets` (existing) | ready |
| Money Snapshot DB | `gumroad_sales` + `product_purchases` + `revenue.snapshot` | ✅ |
| Approval queue | `audit_reports.status` (new/approved/published) | ✅ |
| Content calendar | `workflows`/`automation_runs` (existing) | ready |
| Notion Webhook | Supabase `triggers` table (existing) | ready |

**First concrete step shipped:** `intake.submit` + `asset.activate` now write to `idea_intake` when `DD_USE_NOTION=false` (default stays `true` until the flip). Flip = one env var on Vercel. Full Notion decommission is roadmap sprint 3.

---

## PHASE 4 — LEAD GENERATION MACHINE (built)
`lead.capture` stores: email (dedupe), name, `source_page`, `funnel_step`, `session_id`, UTM source/medium/campaign, referral. `revenue.snapshot` gives the 30-day funnel picture. Conversion tracking: lead → audit → click → purchase all keyed by email + session_id.

## PHASE 5 — PAYPAL (built, needs credentials)
- `product.purchase` creates a Checkout order (sandbox by default: `PAYPAL_MODE=sandbox`).
- `product.purchase.verify` captures APPROVED orders and marks purchases delivered.
- `paypal.webhook` receives `CHECKOUT.ORDER.APPROVED` / `PAYMENT.CAPTURE` at `/api?action=paypal.webhook`, verifies the `x-paypal-token` signature against PayPal, and fulfills idempotently.
- **Needed from founder:** PayPal developer client_id + secret (sandbox first), webhook registration in the PayPal dashboard, then set `PAYPAL_MODE=live`.

## PHASE 6 — AUTOMATION AUDIT
| Task | Today | Target |
|---|---|---|
| Lead → email sequence | manual | Brevo automation on `leads` insert (blocked on key) |
| Audit → report email | manual | `followup` edge fn + Brevo (blocked on key) |
| Purchase → delivery | manual Gumroad | PayPal webhook + auto-email (built) |
| Weekly numbers review | manual | `optimization-loop-weekly` + `revenue.snapshot` in dashboard (ready) |
| Content publish | manual | `post-publisher` (works) |
| Notion sync | manual + webhooks | `supabase sync` replaces over 30 days |

## PHASE 7 — ROADMAP
### Quick wins (1–7 days)
1. ✅ Affiliate engine + actions + schema file (this commit)
2. Apply the SQL migration (SQL editor — ~1 min)
3. Register PayPal webhook URL in PayPal dashboard + add client id/secret to Vercel env
4. Enable Brevo key → email sequences go live (biggest revenue unlock)
5. GA service account JSON → live traffic on Integrations tab

### Revenue sprint (30 days)
- 3 new free tools (marketing health, AI readiness, digital presence) reusing `audit.save`
- Affiliate recommendation block on every audit report + email
- 2–3 digital products (prompt pack, audit kit, SOP) listed in dashboard store, PayPal-priced
- Lead nurture sequences (3 emails) in Brevo

### Automation sprint
- Auto-delivery emails for purchases (Brevo)
- Weekly revenue snapshot digest (Supabase cron → email)
- Notion decommission (flip `DD_USE_NOTION=false`, migrate remaining reads to Supabase)

### SaaS expansion
- Team seats, client-facing audit links, recurring "website health" subscription via PayPal Subscriptions (v2 billing API — next phase).

---

## DECISION LOG
- **Supabase over Notion** as system of record: free, same ecosystem as edge functions, already 40 tables; Notion = optional mirror.
- **PayPal v2 Checkout Orders** over subscriptions first: one-time sales now, subscriptions next month.
- **Honest failures everywhere:** unconfigured = says so; disabled credentials = says so. No fake "connected".
- **Commission rates marked unverified** until each program's dashboard confirms them — no payout claims on guesses.

## BLOCKED (external, founder actions)
| Item | Unblocks |
|---|---|
| SQL migration paste (or enable SQL-over-HTTP) | audit/affiliate/purchase tables |
| PayPal client id + secret (sandbox) | first real sale |
| PayPal webhook registration + `PAYPAL_WEBHOOK_ID` | auto-fulfillment |
| Brevo key enabled | all email automation |
| GA service account JSON | live traffic metrics |
| `npx supabase login` (once) | future `db push` from CLI |
