# SYSTEM_MAP.md — DigitallyDefinedClean Workspace

> Generated 2026-10-24 by automated audit. Evidence-based: status derived from deploy configs
> (vercel.json / wrangler.toml / docker-compose.yml), package.json scripts, and live
> cross-references in source. README/docs claims were NOT trusted unless corroborated by code.

## Projects & Services

| Project | Purpose | Dependencies | Deployment Target | Status |
|---|---|---|---|---|
| `digitallydefined-os-backend` | Primary API backend. Vercel serverless Node (`api/`), local Express mirror (`src/`), Python FastAPI layer (`fastapi/`), Hermes MCP server, Supabase edge functions (`supabase/functions/`) | @supabase/supabase-js, @modelcontextprotocol/sdk, @aws-sdk/client-s3 (R2), express, cors, zod, dotenv; FastAPI (uvicorn) | Vercel (`vercel.json`, live at `digitallydefined-os-backend.vercel.app`), Docker (`docker-compose.yml`, port 3000 + R2 env), Supabase Edge (`supabase/functions/`) | ACTIVE |
| `digitallydefined-dashboard` | React/Vite reputation dashboard (AI status panel, Hermes UI, model selector) | react 18, react-router-dom 7, @supabase/supabase-js, @vercel/analytics, tailwindcss, vite | Vercel (`vercel.json`, outputDirectory `dist`) | ACTIVE |
| `digitallydefined-os-workers` | Cloudflare Workers Notion-workspace automation (agents, Vectorize, Durable Objects, Workflows) | zod, wrangler, @cloudflare/workers-types, tsx | Cloudflare Workers (`wrangler.toml`, AI + Vectorize + Durable Object bindings) | DEPRECATED — orphaned: zero inbound references from any live project; `ACTIVE_DEPENDENCY_MAP.md` and `CODEBASE_AUDIT.md` both mark it LEGACY/orphaned; no code in os-backend or dashboard calls it |
| `digital-products` | Digital product tools/calculators/agents for Gumroad store (Vite/React) | react 18, react-router-dom 7, @heyputer/puter.js, vite | None found — build-only (`vite build`, `build:products` script); no vercel/wrangler/docker config | UNKNOWN |
| `archive/digitallydefined-backend-clean` | Former primary Express backend + its own Supabase functions (analytics, hermes, omniroute, _shared) | express, zod, dotenv (`package.json`) | Vercel (`vercel.json` present) — superseded by `digitallydefined-os-backend` | ARCHIVED — lives under `archive/`, still ships a stale `.env` with retired OMNIROUTE keys/URLs |
| `archive/digitallydefined-website-clean` | Former public website (React/Vite + Supabase auth) | react, react-router-dom, @supabase/supabase-js, vite | Vercel (`vercel.json` present) | ARCHIVED |
| `archive/buzz-agents` | Legacy buzz agent landing pages (ai-rankand-rent-builder, digital-wealth-calculator, niche-keyword-discovery, reputation-intelligence, roadmap-generator) | static pages (no package.json) | None | ARCHIVED |
| `supabase/` (workspace root) | Root-level Supabase tree: `config.toml` + functions `_shared`, `content`, `omniroute`, `quiz-roadmap`, `quiz-submit`, `reputation` | Deno edge runtime | Supabase Edge — **deploy-disabled**: `RETIRED.md` states consolidated 2026-10-09; CLI link renamed `.temp.retired-20261009`; canonical functions now live in `digitallydefined-os-backend/supabase/functions/` | DEPRECATED |
| `digitallydefined-backend-clean` (root) | Stub directory — contains ONLY `.env` + `LEGACY_INVENTORY.md`; real code is in sibling dirs per its own inventory | n/a | None | DEPRECATED — env-file holder only; `.env` carries retired Linode/OMNIROUTE vars |
| `workspace/buzz-agents` | Buzz agent page variants (content-repurposer, digital-superpower-quiz, facebook-community-agent, json-schema-generator, lib/) | static/Tailwind (no package.json) | None found | UNKNOWN |
| `scripts/` | Utility/ops scripts: deploy-buzz-relay.sh, setup-buzz-gateway.sh, brevo triage (IMAP), nostr/hermes-buzz keypair generators, load-env.js, verify_pipeline.mjs | python3, node | Local execution only | UNKNOWN |
| `docs/` | Architecture, deployment-state, runbook, and archived integration docs | n/a | n/a | UNKNOWN (documentation) |
| `Hermes/` | Hermes skills directory (`skills/` only) | n/a | n/a | UNKNOWN |

## Cross-Reference Evidence

- Dashboard → backend: `digitallydefined-dashboard/src/lib/api-client.js`, `src/config/environment.js`, `src/services/api.js` all point at `https://digitallydefined-os-backend.vercel.app` (canonical + fallback). Confirms both ACTIVE.
- Backend → Supabase edge: `digitallydefined-os-backend/server.ts:19` targets `http://127.0.0.1:54321/functions/v1/hermes` (local supabase stack).
- `digitallydefined-os-workers` → referenced by **nothing** outside its own tree and audit docs.
- Supabase project `dijjlppdljpcgyoakdnq` was previously triple-linked; only `digitallydefined-os-backend/supabase/` is canonical now (per `supabase/RETIRED.md`, corroborated by the live function tree there).

</content>