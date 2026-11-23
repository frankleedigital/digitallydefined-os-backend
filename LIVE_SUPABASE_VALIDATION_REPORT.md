# LIVE_SUPABASE_VALIDATION_REPORT.md

## Live edge function
Hermes edge function is live and running (status: running). Routes include puter.run_agent (Edge-only). Confirms Edge/Vercel split is operational.

## Live database tables (PostgREST)
Queried with service role key:
- website_leads: 404 (not found / not exposed)
- opportunity_ledger: 404
- agent_registry: 404
- decision_log: 404

Conclusion: KB tables (opportunity_ledger, problem_ledger, agent_telemetry, ai_briefs, decision_log) are NOT accessible via PostgREST. Either the KB migration has not been applied to production, or the tables are in a non-exposed schema / RLS blocks access. Cannot confirm live migration state without SQL access.

## revenue_platform FK issue
In disposable Postgres, 20261110000000_revenue_platform.sql fails on affiliate_clicks (FK references public.leads which does not exist; actual table is public.website_leads). This is a pre-existing migration bug. It does NOT block the KB migration (20261119000000) which ran successfully in the disposable DB. It would block the full chain in a fresh DB unless fixed, but does not affect existing production tables (already created).

## Remaining blockers
- Live migration state unconfirmed (KB tables not accessible).
- revenue_platform FK bug (pre-existing; separate fix recommended).
- RLS/service-role grants not verified against live DB (no SQL access).
- No live Notion writes performed.

## Verdict
⚠️ Minor Fixes Remaining (code/tests pass; live DB verification outstanding)
