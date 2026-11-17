# DigitallyDefined Ecosystem — Forensic Architecture Report

## 1. Current Routing Architecture
- Single Vercel project `digitallydefined-dashboard` serves both public storefront and private dashboard from one SPA (`src/App.jsx`).
- Hostname-based branching: `isDashboardDomain = hostname === dashboard.digitallydefined.agency || dashboard.digitallydefined.online`.
- On dashboard host `/` → `/dashboard`; on any other host `/` → `/store`.
- Public routes (no auth): `/quiz`, `/quiz/results`, `/store`, `/automations`, `/thank-you-calculator`.
- Dashboard-only routes gated by hostname (NOT auth): `/analytics`, `/assistant`, `/dashboard`, `/intelligence` (PremiumGate only).
- Catch-all: dashboard host → `/dashboard`, else → `/`.

## 2. Domain Architecture
- `dashboard.digitallydefined.agency` (and `.online`) = private dashboard host but serves public quiz/store too.
- `digitallydefined.store` = referenced as public storefront target but returns Cloudflare 522 (abandoned).
- `store.digitallydefined.agency` = new branded funnel host, needs DNS CNAME.
- `francescaonline.gumroad.com` = Gumroad checkout (PUBLIC_SITE fallback).
- Root project (this repo) is the os-backend (Vercel) + online-local storefront.

## 3. Auth Architecture
- Supabase auth; `AuthContext.jsx`. Routes `/login`, `/signup`, `/auth/callback` exist.
- `/dashboard`, `/intelligence`, `/analytics`, `/assistant` are NOT wrapped in an auth guard — only PremiumGate (feature flag) and hostname checks.
- No redirect-to-login for unauthenticated visitors on dashboard routes.

## 4. Deployment Architecture
- Dashboard app: Vercel project `digitallydefined-dashboard`, domain `dashboard.digitallydefined.agency`.
- Backend: `digitallydefined-os-backend.vercel.app` (CORS allows dashboard origin + localhost).
- Quiz lives in dashboard app (not separate site) despite comments claiming otherwise.

## 5. What Changed
- Quiz/storefront merged into the dashboard SPA; `/quiz` redirects formerly pointed to `digitallydefined.store/quiz` (dead).
- `POST_CLEANUP_ARCHITECTURE.md` documents `/quiz` redirect to dead store domain → replaced with in-app quiz.
- Public visitors on preview URLs land on `/store` (storefront) — dashboard internal pages only hidden by hostname, not auth.

## 6. Files Responsible
- `digitallydefined-dashboard/src/App.jsx` (routing + hostname branching)
- `digitallydefined-dashboard/src/pages/DashboardPage.jsx`, `AnalyticsPage.jsx`, `IntelligencePage.jsx`, `AssistantPage.jsx`
- `digitallydefined-dashboard/src/components/PremiumGate.jsx`
- `digitallydefined-dashboard/src/context/AuthContext.jsx`
- `digitallydefined-os-backend/api/index.js` (CORS origins)
- `FUNNEL_RUNBOOK.md`, `POST_CLEANUP_ARCHITECTURE.md`

## 7. Potential Risks
- Dashboard routes (`/dashboard`, `/analytics`, `/assistant`, `/intelligence`) have no authentication enforcement → any visitor who knows the URL on the dashboard host sees them.
- Public storefront and private dashboard share one bundle → internal code shipped to browsers.
- Dead store domain (`digitallydefined.store`) causes 522; funnel references broken.
- `PUBLIC_SITE` points to Gumroad checkout, not a branded storefront.
- Hostname gating is client-side only (bypassable).

## Root Cause
Dashboard functionality appears in storefront locations because the dashboard SPA absorbed quiz + store routes (single app, hostname branching). Security is hostname-based, not auth-based. No separate deployment boundary exists between public and private.

## Recommended Next Steps (no changes made yet)
1. Split into two Vercel projects: `dashboard.digitallydefined.agency` (private, auth-gated) and `store.digitallydefined.agency` (public).
2. Wrap all dashboard routes in an auth guard redirecting to `/login`.
3. Move quiz/storefront code out of dashboard bundle into the public app.
4. Fix DNS for `store.digitallydefined.agency`; retire `digitallydefined.store`.
5. Audit CORS origins; remove dashboard origin from public backend if split.
6. Create `products/` pipeline directory (not yet created).
7. Add Revenue/Lead/Funnel tracking pages to dashboard (not yet implemented).
