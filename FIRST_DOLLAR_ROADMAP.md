# FASTEST PATH TO FIRST $1,000 — 21-DAY LAUNCH ROADMAP

## SMALLEST VIABLE PAID PRODUCT
A single paid tier: "DigitallyDefined OS — Pro" ($49 one-time or $19/mo) gating the Intelligence page + AI Assistant. Everything else stays free/lead-gen.

## MUST FIX BEFORE ACCEPTING MONEY
1. Login import missing in App.jsx (users can't sign in) — 0.5h — Risk High — Dep: none.
2. Hardcoded API key fallback 'DigitallyDefined-OS-2026' — remove; require env — 1h — Risk High.
3. Stripe checkout + webhook + entitlement write to profiles.plan — 8h — Risk High — Dep: Stripe account, Supabase service role.
4. PremiumGate must check profiles.plan server-side, not just UI — 3h — Risk High.
5. Email confirmation handling (no session until confirm) — profile upsert on first auth callback — 2h.
6. .env secrets committed — rotate + remove from git — 1h.

## POSTPONE UNTIL AFTER FIRST REVENUE
- Antigravity tools, Notion tabs, community integration, Automations page, Analytics page, model selector, Google OAuth polish, multi-tier pricing, admin dashboard.

## 21-DAY PLAN (ROI-ranked)
Week 1 (Revenue infra):
- T1 Fix Login import (0.5h, +conversion, High)
- T2 Rotate secrets + remove .env (1h, security, High)
- T3 Stripe checkout + webhook + profile.plan (8h, revenue, High)
- T4 Server-side entitlement check in PremiumGate (3h, revenue protection, High)
- T5 Email confirmation profile upsert (2h, onboarding, Med)
Week 2 (Conversion):
- T6 Store page route + pricing CTA (3h, conversion, Med)
- T7 Quiz → email capture → upsell email (4h, acquisition, Med)
- T8 Onboarding wizard polish + empty states (4h, retention, Med)
Week 3 (Traffic + first dollars):
- T9 Launch quiz lead magnet ads (budget), T10 Feedback widget review, T11 Bug bash + monitoring (Sentry).

## FASTEST PATH TO FIRST DOLLAR
Fix auth → add Stripe checkout → gate Intelligence/AI Assistant behind profiles.plan → launch quiz funnel with upsell CTA → drive traffic. Target: 21 paying users at $49 = $1,029.