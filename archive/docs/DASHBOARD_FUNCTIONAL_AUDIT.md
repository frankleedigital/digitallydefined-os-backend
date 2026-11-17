# FUNCTIONAL AUDIT — DASHBOARD PAGES

## WORKING FEATURES
- /dashboard (DashboardPage) — loads, reads Supabase profile; core shell works.
- /quiz + /quiz/results — on-device scoring, email capture best-effort.
- /login — fixed; CTA "Go to dashboard" works.
- /onboarding — loads.

## PARTIALLY WORKING
- /intelligence — premium-gated UI; backend intelligence endpoint dependency.
- /assistant — chat calls backend business-partner; no streaming/retry.
- /analytics — depends on backend analytics.
- /intake, /review — partial.
- /automations — partial.

## BROKEN
- /store route not registered (StorePage exists but unused) — dead.
- Auth callback is no-op redirect.

## REVENUE-PRODUCING
- None in-app (payments external via Gumroad). Quiz is lead-gen only.

## IGNORE FOR LAUNCH
- Antigravity, Notion tabs, community, model selector, analytics page.

## FASTEST PATH TO LAUNCH IN 21 DAYS
1. Fix auth import (done).
2. Register /store route + pricing CTA.
3. Add Stripe checkout + entitlements.
4. Gate Intelligence/Assistant behind plan.
5. Drive quiz funnel traffic.
6. Ignore non-revenue features.