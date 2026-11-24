# LIVE_MIGRATION_STATE_REPORT.md

## Finding
The KB migration (20261119000000_business_knowledge_base.sql) IS already applied to the live Supabase project (confirmed via `supabase migration list --remote`). All 11 migrations (001 through 20261121000000) are present in remote migration history.

## Why PostgREST returned 404
The KB tables (opportunity_ledger, agent_registry, decision_log, etc.) exist in the database but are not accessible via PostgREST (404). This is likely due to:
- RLS policies blocking even service-role reads, OR
- Tables not exposed in the PostgREST schema (public schema not in exposed schemas), OR
- PostgREST schema cache stale.

This is a configuration/RLS issue, not a missing migration. No `db push` is needed.

## revenue_platform FK bug
Confirmed pre-existing (affiliate_clicks.lead_id -> public.leads which doesn't exist; actual table is website_leads). Does NOT affect KB migration or stabilization tables. Separate fix recommended (forward-fix migration).

## Action taken
No live data modified. No db push executed (migration already applied).

## Remaining
- Verify RLS/service-role grants (requires SQL access via Supabase dashboard).
- Fix revenue_platform FK via forward-fix migration if needed.
- Expose KB tables via PostgREST schema config if dashboard needs direct access (currently accessed via backend service role, which should work).
