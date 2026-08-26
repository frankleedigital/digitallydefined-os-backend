# DigitallyDefined Data Pipeline — Setup & Deploy Guide

Website → Supabase → Dashboard → Hermes → AI Business Partner.

```
digitallydefined.online          Supabase (dijjlppdljpcgyoakdnq)
tracking.js ──POST /functions/v1/analytics──► events | leads | sessions
                                              funnels | assets | products
        ▲                                              │
        │                              analytics Edge Function (aggregates + AI recommend)
 Dashboard /analytics page  ◄─────────────────────────┤
 AssistantPage (AI Business Partner) ◄────────────────┤
 Hermes MCP skill "Data Watcher" ─────────────────────┘──► Linear tasks
```

## 1. Files created / modified

**Supabase backend**
- `digitallydefined-os-backend/supabase/migrations/004_create_analytics_tables.sql` — tables `events`, `leads`, `sessions`, `funnels`, `assets`, `products` + RLS (service_role full access; anon INSERT-only for capture) + updated_at triggers.
- Copy: `digitallydefined-online-local/supabase/migrations/004_create_analytics_tables.sql`
- `digitallydefined-os-backend/supabase/functions/analytics/index.ts` — NEW edge function: ingestion (`track`) + reporting (`overview|traffic|funnels|assets|products|recommend`).

**Website (`digitallydefined-online-local`)**
- `src/lib/tracking.js` — NEW lightweight tracker (page views, CTA clicks, form submits, quiz start/complete, product interest, scroll depth, session duration/heartbeat). Batched fetch + sendBeacon. Exposed as `window.ddTrack`.
- `src/main.jsx` — initializes tracking; SPA route-change page views.
- `src/pages/Contact.jsx` — form_submit + lead events with email.
- `src/components/EmailSignup.jsx` — form_submit + lead events with email.
- `src/pages/Products.jsx` — product_interest on tool cards.
- `src/pages/Quiz/DigitalSuperpowerQuiz.jsx` — quiz_start / quiz_complete with email + superpower.

**Dashboard (`digitallydefined-dashboard`)**
- `api/analytics.js` — NEW Vercel function `/api/analytics?action=overview&days=30` (Hermes/AI partner query endpoint).
- `src/lib/analytics.js` — NEW client: `fetchAnalytics`, `getAnalyticsBrief`, `formatBriefAsContext`.
- `src/pages/AnalyticsPage.jsx` — NEW live metrics page: traffic, leads, conversions, engagement, asset performance, product interest + "Analyze & Recommend" button.
- `src/App.jsx` — added protected `/analytics` route.
- `src/pages/AssistantPage.jsx` — AI Business Partner now loads the live analytics brief into its system prompt every session.

**Hermes MCP**
- `digitallydefined-os-backend/hermes/tools/data_watcher.py` — NEW skill "DigitallyDefined Data Watcher".
- `digitallydefined-os-backend/hermes/mcp_server.py` — skill registered into the tools dict.

**Verification**
- `scripts/verify_pipeline.mjs` — end-to-end test.

## 2. Deploy steps

### a) Apply the SQL migration
```bash
cd digitallydefined-online-local   # or digitallydefined-os-backend (both linked to dijjlppdljpcgyoakdnq)
supabase db push                   # applies 004_create_analytics_tables.sql
```
Or paste the SQL into Supabase Studio → SQL Editor → Run.

### b) Deploy the analytics Edge Function
```bash
cd digitallydefined-os-backend/supabase
supabase functions deploy analytics --no-verify-jwt
```
(`verify_jwt = false` is also set in `config.toml`; the `--no-verify-jwt` flag is required because remote deploys don't read the per-function config. Auth is enforced inside the function via `x-api-key`.)

### c) Deploy website + dashboard to Vercel
Both projects deploy automatically from their Git repos; otherwise:
```bash
cd ../digitallydefined-online-local && vercel --prod     # digitallydefined.online
cd ../digitallydefined-dashboard  && vercel --prod       # dashboard.digitallydefined.online
```
Env vars required in Vercel (already set in `.env` files):
- `VITE_SUPABASE_URL=https://dijjlppdljpcgyoakdnq.supabase.co`
- `VITE_DASHBOARD_API_KEY=DigitallyDefined-OS-2026`
- `VITE_GROQ_API_KEY=<groq key>` (AI Business Partner)

### d) Configure Hermes skill env (~/.hermes/.env)
```
SUPABASE_URL=https://dijjlppdljpcgyoakdnq.supabase.co
DASHBOARD_API_KEY=DigitallyDefined-OS-2026
LINEAR_API_KEY=<linear api key>      # optional, enables auto task push
LINEAR_TEAM_ID=<linear team uuid>
```
Restart the MCP server; it prints `✓ MCP skill registered: DigitallyDefined Data Watcher`.

## 3. Verify end-to-end
```bash
node scripts/verify_pipeline.mjs             # ingest synthetic events + read overview
node scripts/verify_pipeline.mjs --recommend # also run AI Business Partner analysis
```
Then:
1. Browse https://digitallydefined.online — check Supabase Table Editor → `events` for new rows.
2. Open https://dashboard.digitallydefined.online/analytics — live metrics render.
3. Ask the AI Business Partner "how is the site doing?" — answers cite real numbers.
4. From Hermes: `analyze_trends()`, `recommend_next_steps()`, `push_recommendations_to_linear()`.

## 4. Security notes
- Reporting actions require `x-api-key`; only `track` accepts anon callers.
- Anon PostgREST access is INSERT-only on events/leads/sessions; no reads exposed.
- The dashboard API key is public by nature (client-side); rotate via `DASHBOARD_API_KEY` secret if abused, and consider rate-limiting `track` at the gateway.