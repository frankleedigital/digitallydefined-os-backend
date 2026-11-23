# MIGRATION_VALIDATION_REPORT.md

## Migration validation result
Run against disposable Postgres 15 (Docker) with full preceding migration chain (001..20261121000000).

KB migration (20261119000000_business_knowledge_base.sql): PASSED.
All 5 KB tables created: opportunity_ledger, problem_ledger, agent_telemetry, ai_briefs, decision_log.

## Pre-existing issue found (not in scope)
20261110000000_revenue_platform.sql: FK affiliate_clicks.lead_id references public.leads(id), but the table is public.website_leads (002). CREATE TABLE affiliate_clicks fails. This is a pre-existing migration bug unrelated to this branch.

## Live migration state
Not verified (no Supabase tooling/credentials). Cannot confirm whether 20261119000000 is applied in production.

## Edge vs Vercel route ownership
Vercel-only: agents.*, antigravity.* (api/index.js). Edge-only: puter.run_agent (hermes/index.ts). Shared: status, dashboard, chat, etc. (action-registry.ts). Documented in VERCEL_ONLY_ACTIONS.md.

## Dashboard path verification
- agents.list/run/orchestrate: Vercel api/index.js (ALLOWED + handled). Dashboard ddPost targets /api. OK.
- antigravity.*: Vercel api/index.js. Dashboard callSupabaseEdge targets /api. OK.

## Remaining blockers
- Live migration state unconfirmed.
- revenue_platform FK bug (pre-existing, separate fix).
- RLS/service-role grants not verified against live DB.

## Verdict
⚠️ Minor Fixes Remaining (code/tests pass; live DB verification outstanding)
