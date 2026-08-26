# DigitallyDefined — Post-Repair Deployment State (Aug 2026)

## Validation results (all passing)
- ✅ `digitallydefined-dashboard` — vite build OK
- ✅ `digitallydefined-online-local` — vite build OK
- ✅ `digitallydefined-os-backend` api/ — node --check OK (index, quiz, intelligence)
- ✅ All 8 Supabase Edge Functions pass `deno check`
- ✅ CORS allowlists consistent across all 4 dispatch points
  (`api/index.js`, hermes edge, `_shared/cors-utils.ts`, backend-hermes):
  includes prod domains + www + localhost 3000/3001/5173 + Vercel previews
- ✅ No hardcoded API keys in any shipped source

## What changed in this repair cycle
1. All hardcoded `DigitallyDefined-OS-2026` fallbacks removed from client bundles & functions.
2. CORS strict allowlists everywhere; wildcard `*` eliminated.
3. Single Hermes endpoint: `{SUPABASE}/functions/v1/hermes` (`VITE_HERMES_ENDPOINT`).
4. Unified action registry: `supabase/functions/_shared/action-registry.ts` (mirrored in api/index.js).
5. Duplicate edge-function mirror tree (`supabase/supabase/`) deleted; CLI link state moved to `supabase/.temp`.
6. Dashboard slimmed: firebase(-admin), googleapis, groq-sdk, @notionhq/client, @vercel/node removed;
   AssistantPage now routes AI through the Hermes `chat` action.
7. Dead servers retired: Express `src/` deleted; FastAPI deleted; Python MCP archived to
   `docs/hermes-mcp-archive/`.
8. 7 duplicate `*Unified.jsx` pages deleted (router uses non-Unified variants).
9. Dependency alignment: lucide-react ^1.28.0 both frontends; supabase-js ^2.112.2 everywhere.

## REQUIRED before/at deploy (owner actions)
1. **Rotate** the exposed `DASHBOARD_API_KEY` and update it in:
   - `supabase secrets set DASHBOARD_API_KEY=<new>`
   - Vercel env for BOTH frontend projects (`VITE_DASHBOARD_API_KEY`)
   - local `.env` files (they currently still hold the old value — which is why
     built bundles still inline it)
2. **Rotate other keys** present in committed `.env` files (OpenRouter/Groq/Anthropic/
   Brevo/Notion/Telegram) and purge `.env` history from git if the repo is shared.
3. **Apply Supabase auth URLs** per `docs/supabase-auth-redirects.md`.
4. **Deploy:** push backend → `supabase functions deploy` (all 8) → deploy both frontends.
5. **Live smoke tests:** MentorWidget green light on prod; quiz submit → Hermes reply;
   dashboard login + automations list + Assistant page; tracking events landing.

## Phase 6 — OmniRoute-only AI consolidation
ALL AI traffic now routes through a single gateway: **OmniRoute**.
Direct provider calls (Agnes, Groq, OpenRouter, NaraRouter, NVIDIA, Anthropic,
Mistral, Novita) have been removed from every AI call site:
- `api/index.js` AI_PROVIDERS → omniroute only
- `os-backend supabase/functions/hermes` getCandidates → omniroute only
- `os-backend supabase/functions/analytics` recommendations → omniroute only
- `_shared/aiRouter.ts` (both trees, synced) → omniroute only
- `online-local supabase/functions/hermes` + `backend-hermes` → omniroute only

Required secrets (Supabase Edge Functions + Vercel as applicable):
- `OMNIROUTE_API_KEY`  (REQUIRED — set via `supabase secrets set OMNIROUTE_API_KEY=...`)
- `OMNIROUTE_BASE_URL` (optional; default https://api.omniroute.ai/v1)
- `OMNIROUTE_MODEL`    (optional; default "auto" = gateway picks)

Provider keys for Agnes/Groq/OpenRouter/etc. are no longer read by any function;
they can be removed from secrets after OmniRoute is confirmed working.

⚠️ Dual-repo warning: BOTH `digitallydefined-online-local/supabase` and
`digitallydefined-os-backend/supabase` contain CLI link state (`.temp/project-ref`)
pointing at project `dijjlppdljpcgyoakdnq`. Deploying functions from either repo
overwrites the other's versions. Both trees are now kept in sync, but pick ONE repo
(recommended: os-backend) for all future function deploys to avoid drift.

## Known non-blockers
- Website bundle is ~1.6 MB (382 KB gz) — code-splitting recommended later.
- `scripts/nostr-keypair.txt` contains a private key — rotate & delete.
- In-memory rate limiting in serverless is best-effort only.
