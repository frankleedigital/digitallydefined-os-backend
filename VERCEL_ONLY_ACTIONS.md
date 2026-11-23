# VERCEL_ONLY_ACTIONS.md

## Vercel-only actions (not in shared edge allowlist)
agents.list, agents.run, agents.orchestrate,
antigravity, antigravity.createNotionPage, antigravity.updateDatabase,
antigravity.buildTemplate, antigravity.reconcileDatabase, antigravity.runAutomation,
antigravity.status, antigravity.queryDatabase, antigravity.getPage,
antigravity.patch, antigravity.phase21.rollout

## Routing
These actions are handled by api/index.js (Vercel). The Dashboard sends them via POST /api with x-api-key auth. The Supabase Edge Function does not handle them (returns 400 unknown action).

## puter.run_agent
Handled by the Supabase Edge Function (puter.run_agent handler in hermes/index.ts). Also listed in POST_ONLY_ACTIONS. Vercel does not handle it.
