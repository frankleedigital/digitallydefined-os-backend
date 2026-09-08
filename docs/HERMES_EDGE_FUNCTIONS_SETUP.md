# Hermes Supabase Edge Functions — Setup Reference

Project: `digitallydefined-os-backend` (Supabase project `dijjlppdljpcgyoakdnq`)
Live endpoint: `https://dijjlppdljpcgyoakdnq.supabase.co/functions/v1/hermes`

## 1. Layout

```
digitallydefined-os-backend/supabase/
├── config.toml                     # project_id + scheduled functions
└── functions/
    ├── _shared/                    # shared Deno modules (imported by all functions)
    │   ├── action-registry.ts      # SINGLE SOURCE OF TRUTH for action names + access rules
    │   ├── agent-schemas.ts        # JSON schemas + validateAgentOutput
    │   ├── aiRouter.ts             # AI routing helper
    │   ├── omniroute.ts            # OmniRoute gateway client
    │   ├── hermesSystemPrompt.ts   # Hermes system prompt
    │   ├── brevo-email.ts          # Brevo email (mode-aware routing)
    │   ├── cors-utils.ts           # shared CORS helpers
    │   ├── community-helpers.ts / community-triggers.ts
    │   ├── social-publishers.ts (+ facebook/instagram/linkedin/threads publishers)
    │   ├── meta-auth.ts, notion-*.ts, sheets-sellable.ts, sellable-auth.ts
    │   ├── sync-aggregator.ts, roadmaps-store.ts, content-sources.ts
    │   └── cron-dedup-logger.ts, email-publish.ts
    ├── hermes/index.ts             # ← MAIN Hermes brain (~1,115 lines, ~50KB)
    ├── analytics/index.ts          # ingestion + reporting (x-api-key protected internally)
    ├── followup/index.ts           # daily follow-up email pipeline (cron)
    ├── optimization-loop/index.ts  # daily: clusters optimization_signals → user_clusters
    ├── optimization-loop-weekly/index.ts # weekly: writes a weekly_reports row
    ├── post-publisher/index.ts     # social publishing cron
    ├── sellable/index.ts           # sellable products cron (manual/compat)
    └── sync/index.ts               # vault sync endpoint
```

The backend is NOT a Vercel project and NOT a Node server — Hermes is a Deno Edge
Function (`supabase/functions/hermes/index.ts`) using `serve()` from
`https://deno.land/std@0.224.0/http/server.ts`. `api/index.js` is a legacy Vercel
dispatcher that mirrors the action registry (kept in sync manually).

## 2. The `hermes` function — how it works

### Entry / CORS
- `ALLOWED_ORIGINS` allowlist: `dashboard.digitallydefined.online`,
  `digitallydefined.online`, `www.digitallydefined.online`, and localhost
  `3000/3001/5173`. No wildcard `*` — unknown origins get the dashboard origin.
- Handles `OPTIONS` preflight, rejects non-POST with 405.

### Action routing
- Body must contain `action`. Unknown actions → 400 via `isKnownAction()`.
- Access rules come from `_shared/action-registry.ts`:
  - **Public (no key):** `subscribe`, `contact`, `quiz.complete`, `public.chat`,
    `website.content` (read-only copy), everything prefixed `agent.`
  - **Authed (`x-api-key`):** `status`, `routes`, `auth.verify`, `test-env`,
    `dashboard`, `chat`, `intelligence`, `hermes.agent`, `mentor.dev`,
    `ai.recommendations`, `brain.brief`, `automation.*`, `integration.*`,
    `license.verify`, `website.edit`, etc.

### Auth
- `DASHBOARD_API_KEY` Supabase secret is the expected key. Accepted from any
  channel: `x-api-key`, `apikey`, `Authorization: Bearer`, or body `key` — but all
  are compared against the secret, so a wrong key never authenticates.
- Masked diagnostic logging on every request: `action`, `auth=public|authed`,
  `expected=set|UNSET`, masked `provided`.
- Missing/wrong key on non-public actions → 401.

### AI layer — OmniRoute ONLY
- No direct provider calls, no fallbacks. One candidate:
  - Secrets: `OMNIROUTE_API_KEY` (required), `OMNIROUTE_BASE_URL`
    (default `https://api.omniroute.ai/v1`), `OMNIROUTE_MODEL` (default `auto`).
  - `runAI(system, user, jsonMode)` POSTs to `{base}/v1/chat/completions` with
    90s timeout; jsonMode forces `response_format: json_object`, temp 0.35, 4k tokens.
  - Parses both JSON and SSE reply shapes.
- `parseJsonReply()` strips `<think>` blocks / code fences, un-escapes quotes, and
  extracts the first balanced `{...}` block as a fallback.

### Website content store (`website.content` / `website.edit`)
- `SITE_CONTENT_CATALOG` in `hermes/index.ts` defines editable fields (e.g.
  `home.heroHeadline`) with defaults — mirrors `DEFAULT_SITE_CONTENT` in
  `online-local/src/lib/siteContent.js`.
- Reads overrides from the `site_content` table (Supabase REST, service role),
  merges over defaults; `website.edit` uses `runAI` to map a natural-language
  request to a catalog key and upserts `{content_key, value}`.

### Form handlers
- `subscribe` → upsert `website_leads` (`on_conflict=email,source`).
- `contact` → insert `contact_messages`.
- `quiz.complete` → upsert `website_leads` + insert `quiz_roadmaps`, then sends
  email via `_shared/brevo-email.ts` with mode-aware routing.
- DB writes go through `insertRow()` using `SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY` (auto-injected Supabase secrets) against PostgREST.

### Integration actions (`integration.*`)
- `.start` flows return success placeholders (no OAuth yet);
  `integration.googleAnalytics/social/email/community` currently return sample
  data with TODOs to wire real provider APIs.

## 3. Scheduled functions (config.toml)

```toml
project_id = "dijjlppdljpcgyoakdnq"

[functions.optimization-loop]          verify_jwt=false  schedule="0 5 * * *"
[functions.optimization-loop-weekly]   verify_jwt=false  schedule="0 6 * * 1"
[functions.analytics]                  verify_jwt=false  # x-api-key protected in-function
```

`followup`, `post-publisher`, `sellable`, `sync` are invoked manually or via
their own triggers; all cron functions read env via `Deno.env.get(...)` and share
`_shared/` modules (e.g. `sync-aggregator.ts`, publishers, `cron-dedup-logger.ts`).

## 4. Consumers

| Repo | Role | AI path |
|---|---|---|
| digitallydefined-dashboard | Dashboard SPA (Vercel) | `callSupabaseEdge` → Hermes edge |
| digitallydefined-online-local | Marketing site (Vercel) | `hermes.js` → Hermes edge |

Dashboard clients use `src/lib/supabase-edge.js` (`getSupabaseEdgeUrl` /
`getSupabaseEdgeHeaders` / `callSupabaseEdge`) — all former Vercel serverless
proxies are retired in favor of the single Hermes endpoint.

## 5. Secrets (Supabase dashboard → Functions → Secrets)

- `DASHBOARD_API_KEY` — client auth for authed actions
- `OMNIROUTE_API_KEY` / `OMNIROUTE_BASE_URL` / `OMNIROUTE_MODEL` — AI gateway
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — auto-injected, used for PostgREST writes
- Per-function: `SENDGRID_API_KEY` (followup), Brevo keys, Notion/Sheets/social
  credentials as needed by `_shared/` modules

## 6. Local development

`scripts/dev.js` documents it: running locally requires the Supabase CLI +
Docker Desktop (`supabase start`, then `supabase functions serve hermes`).

Deploy: `supabase functions deploy hermes` (and per-function for the crons).
