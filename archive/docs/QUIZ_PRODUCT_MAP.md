# QUIZ → PRODUCT MAP
**2026-11-10 · Every sellable asset mapped to the quiz outcome it converts.**

> Note on taxonomy: the live quiz scores **5 personas** (Builder, Creator, Educator, Strategist, Connector — `lib/quiz/personas.js`). The categories in the mission brief (Operator/Agency/Affiliate/Beginner/Advanced/Traffic/Monetization/Automation/Personal Brand) are *outcome tags*; below each persona is annotated with its dominant outcome tags so both views work. The map uses the **real** personas — the product engine must match what the quiz actually outputs.

All assets referenced exist today (see ASSET_INVENTORY). Nothing here is invented.

## BUILDER (Digital Architect)
*Outcome tags: Automation, Traffic, Monetization, rank-and-rent*
- **Best product:** Digital Landlord offer (merged R&R Blueprint + Toolkit + Leasing chapter)
- **Best upsell:** DBO ($97-197) — "the whole system behind the one asset"
- **Best lead magnet:** Local SEO Quick-Start Checklist (launch checklist = builder language)
- **Best first purchase:** Digital Property Starter Kit ($17)
- **Best high-ticket:** Digital Fortress Blueprint ($47-97)
- **Affiliate pair:** Ahrefs / Cloudways / Hostinger (from engine + CSV fit scores)

## CREATOR (Content Alchemist)
*Outcome tags: Personal Brand, Monetization, content*
- **Best product:** 50 AI Prompts pack + High-Demand/Low-Supply Prompt pack (as "Creator Prompt Suite")
- **Best upsell:** High-Ticket Affiliate Marketing guide (turns content into commissions)
- **Best lead magnet:** 5 Estate Documents? No — use **Trigger Word Bank excerpt** (50 free triggers) as the magnet
- **Best first purchase:** 50 AI Prompts ($17-27)
- **Best high-ticket:** AI Business Partner sub ($29-99/mo, post-proof) or DBO
- **Affiliate pair:** Canva (95% fit) / Jasper (90% fit) from `affiliate_programs.csv`

## EDUCATOR (Clarity Catalyst)
*Outcome tags: Beginners, Personal Brand, teaching systems*
- **Best product:** RETIREMENT MASTERY (2-part) — teaching/legacy framing
- **Best upsell:** 10x ROI Roadmap (AJV audit) as the "numbers companion"
- **Best lead magnet:** Juggling Bills & Retirement guide (free excerpt)
- **Best first purchase:** Digital Property Starter Kit or 90 Days to Financial Peace (once .gdoc→PDF)
- **Best high-ticket:** DBO (organizes her teaching business)
- **Affiliate pair:** ConvertKit / GoHighLevel (email systems for teachers)

## STRATEGIST (high-leverage planner)
*Outcome tags: Traffic, Monetization, agency*
- **Best product:** Intent to Income™ (strategy platform, 101KB, complete)
- **Best upsell:** Digital Real Estate Mastery Study Guide + PRD Blueprints Pack (agency-grade)
- **Best lead magnet:** **niche-viability-audit-tool.xlsx** (a strategist's tool, perfect)
- **Best first purchase:** Digital Wealth Snapshot (free snapshot → paid Asset Plan)
- **Best high-ticket:** Digital Fortress Blueprint or DBO
- **Affiliate pair:** SEMrush / SurferSEO (from engine's `low_seo` signal mapping)

## CONNECTOR (community & mentoring)
*Outcome tags: Personal Brand, lead generation, community*
- **Best product:** Legacy Building for Solo Women (483KB, complete, on-mission)
- **Best upsell:** Affiliate Starter Kit (36-program CSVs + how-to) — community monetization
- **Best lead magnet:** 96-Hour Scam Response Plan (trust/education hook)
- **Best first purchase:** High-Ticket Affiliate Marketing guide ($27-47)
- **Best high-ticket:** DBO (runs her community's business) or Reputation Command Center (B2B, later)
- **Affiliate pair:** GoHighLevel / Mighty Networks-adjacent (from CSV fit column)

## CROSS-PERSONA RULERS (how the engine picks)
1. Quiz → persona → this table → **lead magnet (free, gated by email)** + **first purchase** shown at `/quiz/results`
2. **Best offer per persona = its "Best first purchase"**, one card, one price.
3. **Upsell engine** (post-purchase email, when Brevo is fixed): persona's "Best upsell" — that is the entire nurture sequence, no new content needed.
4. **High-ticket trigger:** persona's "Best high-ticket" appears in week-2 email of the sequence, with the existing Strategic Launch Roadmap PDF as the proof artifact.

## WHAT THE MAP EXPOSES
- **Zero product is needed that doesn't exist.** Every persona has a complete free→first→upsell→high-ticket ladder from the current shelf.
- The **only missing piece is the wiring**: `/quiz/results` currently offers nothing. One offer card per persona + the (existing) email capture makes the whole map live.
- Two assets are **persona-specific and cheap to finish**: niche-audit xlsx (Strategist magnet) and Trigger Word Bank excerpt (Creator magnet) — both already finished, just gate + link.
