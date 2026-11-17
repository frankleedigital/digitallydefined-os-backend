# V1 SIMPLIFICATION PLAN — "Get a stranger to pay"
**2026-11-10**
Goal: the smallest DigitallyDefined that does exactly four things:
1. Take the quiz  2. Produce an **AI** roadmap  3. Show **one** high-value growth action  4. Sell DBO
Everything else: DELETE / HIDE / DEFER / MERGE / SIMPLIFY below.

---

## 1. CUT LIST (the "nothing else matters" pass)

### DELETE (code; no user loses real value)
- `intelligence` + `brain.brief` **hard-coded handlers** → replaced by the Brain (§3)
- `automation.sync/list/logs/run/events` no-op endpoints → removed
- `dashboard/src/lib/aiProvider.js` dead provider chain → removed (use `hermes.agent`/Brain only)
- `PUBLIC_SITE` constant + `dashboard.digitallydefined.online` domain check → removed
- `asset.marketing` template generator (or REBUILD as one Gemini call over the same template — cheaper to keep only if DBO marketing copy needs it; default: delete)

### HIDE (user-facing; keep the code, remove from the customer path)
- DashboardPage tabs **Brain, Intel, Automations, Reputation, Notion, Antigravity** → move behind an **owner mode** (a `?owner=1` flag or a separate owner sub-app). The customer dashboard becomes **3 screens**: `Your Plan` (Brain), `Your Analytics` (GA), `Store`.
- `/onboarding`, `/intake`, `/review`, `/thank-you-calculator` → not linked anywhere in V1 (routes can stay, links go)

### DEFER (post-proof)
- In-app PayPal purchase (Gumroad is the V1 checkout; PayPal later or as secondary)
- Membership/`PremiumGate` tier, `digital-products` storefront deploy, `.agency`/`.store` rebuilds, courses/templates/bundles, multi-tenant billing

### MERGE
- **Intelligence + Analytics + Growth + Brain → one "Your Growth Plan" screen** (the Brain renders: diagnosis → 3 moves → one offer). The four fake/dark tabs disappear into it.
- **Gumroad account + price → single `gumroad.js` source of truth** ($27, one account)
- **`subscribe` (missing fn) + `lead.capture` → one capture path** (`lead.capture` already dedupes + stores + reports Brevo honestly)

### SIMPLIFY
- Public `/` = one screen: value prop · "Take the 2-minute quiz" · "or grab the Digital Business OS — $27" (two CTAs, nothing else)
- Quiz results = roadmap · **one offer card (DBO)** · email capture (existing)
- "Your Growth Plan" = diagnosis · 3 moves · 1 highlighted action · 1 CTA (DBO / audit / affiliate, persona-driven)

## 2. THE V1 CUSTOMER JOURNEY (5 screens total)
```
/ (public: quiz CTA + DBO CTA)
→ /quiz (5 questions)
→ /quiz/results (AI roadmap on screen + DBO offer card + email capture)
→ /plan (logged-in "Your Growth Plan": diagnosis, 3 moves, 1 action, 1 CTA)
→ Gumroad checkout ($27 DBO)  [tracked via webhook → gumroad_sales]
Weekly email (Brevo, once fixed): your next move + link back to /plan
```

## 3. ONE CENTRAL AI BRAIN (Phase 4 design)

### Can today's AI actually see anything? (the audit answer)
| AI surface | Sees quiz? | profile? | roadmap? | analytics? | business data? | Verdict |
|---|---|---|---|---|---|---|
| `hermes.agent` assistant | ✗ | ✗ | ✗ | ✗ | partial (owner FB/Brevo/Sheets, mostly failing) | **disconnected chatbot** |
| `intelligence` | ✗ | ✗ | ✗ | ✗ | ✗ | **not AI at all** (literal) |
| Growth/Analytics "recommend" | ✗ | ✗ | ✗ | reads own pipeline | ✗ | **dead** (retired OmniRoute key) |
| Roadmap generation | ✗ | ✗ | — | ✗ | ✗ | **static**, not AI |
| `business.partner` | ✗ | ✗ | ✗ | ✗ | partial real | real AI, wrong context (owner, not customer) |

**None of the customer-facing AI can see the customer.** That's the single root defect.

### Design: `ai.brief` — one endpoint, one brain
**New backend action `ai.brief` (os-backend), reusing the `businessPartner.js` Gemini-direct plumbing + structured-JSON prompt pattern.**

**Inputs (all already exist — no new integrations):**
| Input | Source |
|---|---|
| Quiz results | Supabase `quiz_roadmaps` row for the user's email (persona, answers, roadmap) |
| User profile | Supabase auth user + `leads` row (UTM, source_page, funnel_step) |
| Roadmap | saved static roadmap + (if generated) the AI roadmap |
| Analytics | the now-live GA card payload (`users30d`, `sessions30d`, `topPages`, `bounceRate`) |
| Audit results | `audit_reports` rows (after the migration is applied) + deterministic `affiliate.recommend` output |
| Offer catalog | `gumroad.js` (single source of truth) |

**Output (structured JSON, cached 24h per user):**
```json
{
  "diagnosis": "one plain-English sentence on what's working / stuck",
  "next_3_moves": [ { "move": "...", "effort": "low|med", "why_now": "..." } ],
  "primary_action": "the ONE move the customer should do this week",
  "offer": { "product": "digital-business-os", "price": 27, "reason": "persona-fit line", "url": "<gumroad>" },
  "email_body": "the one weekly playbook email (matches the 'one email a week' promise)",
  "confidence": "high|med|low",
  "data_gaps": ["no analytics yet (tag live <24h)", "no audit on file"]
}
```

**Hard rules (anti-illusion, taken from the businessPartner prompt and enforced):**
1. Only data actually fetched may appear — every number must trace to an input above.
2. Missing input → say so in `data_gaps`; **never invent** counts, dates, or members.
3. AI failure → fall back to the **static persona roadmap** (existing) so the user still gets value; the screen shows "AI brief unavailable — here's your plan."
4. `confidence: low` when >2 inputs missing — shown to the user, not hidden.

**Why one brain:** Intelligence, Growth, Analytics-recommend, and the roadmap all become **views of the same `ai.brief` payload** — four fake/dark features collapse into one real one. That is simultaneously the simplification and the "AI-powered partner" the vision describes.

## 4. EXECUTION ORDER (fastest to first *consistent* sale)
| # | Task | Effort | Unblocks |
|---|---|---|---|
| 1 | Unify DBO price/account in `gumroad.js` + StorePage | ½d | honest checkout |
| 2 | Public funnel `/` (quiz + DBO CTAs) on dashboard domain | ½d | cold-visitor entry |
| 3 | Offer card at `/quiz/results` (DBO, persona copy) | ½d | **first sale path live** |
| 4 | Apply revenue SQL migration + Gumroad webhook → `gumroad_sales` | 1d | **tracked, repeatable revenue** |
| 5 | `ai.brief` Brain endpoint + "Your Growth Plan" screen (merges 4 tabs) | 2–3d | AI roadmap + one growth action |
| 6 | Fix Brevo (or swap provider) → quiz email + weekly playbook | 1d | retention / "consistent" |
| 7 | HIDE owner tabs; DELETE fake endpoints (Tiers 1–2 of Truth vs Illusion) | 1d | no fake data in customer's face |

**"Consistent sale" definition (proof-of-concept bar):** a *second* stranger (not you, not a friend) completes `/` → quiz → roadmap → offer → Gumroad purchase, with the purchase appearing in `gumroad_sales` and the email landing in Brevo. Repetition of the path = consistency. If step 4's webhook fires on two different buyers, the machine is real.

## 5. WHAT WE REFUSE TO BUILD IN V1
New features. Enterprise. Multi-tenant billing. Courses/templates storefront. In-app PayPal. Notion/Antigravity for customers. Everything on the DEFER list stays off until the first consistent sale is logged twice.
