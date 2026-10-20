# Credential Registry — DigitallyDefined
# Scanned: 2026-10-18. All values verified by hash. No secret values printed.
#
# Rules:
#   1. Every credential appears in exactly ONE application-specific .env file.
#   2. Archive files (.env in archive/, .env.local.new) are excluded from "one place" count.
#   3. .env.example always contains placeholder values — never production secrets.
#   4. VITE_ vars in Vercel-deployed repos are bundled into client JS by design (anon keys only).
#   5. "Same hash" = same value confirmed by SHA-256 truncated to 16 chars.

---

## Credential Map

| # | Credential | Owner | Purpose | Canonical Location | Other Locations | Rotate Via |
|---|---|---|---|---|---|---|
| 1 | `SUPABASE_SERVICE_ROLE_KEY` | os-backend | Full-db bypass; edge functions, backend writes | `os-backend/.env` | None | Supabase Dashboard → Settings → API → Reset |
| 2 | `SUPABASE_ANON_KEY` | All apps | Public read (RLS-protected); safe to ship to client | `os-backend/.env` | None | Supabase Dashboard → Settings → API → Reset anon key |
| 3 | `VITE_SUPABASE_ANON_KEY` | Dashboard | Same as above, Vite-bundled for client calls | `dashboard/.env.local` | None | Same as #2; then `npm run build` |
| 4 | `SUPABASE_URL` | All apps | Project URL, not a secret | `os-backend/.env` | None | Project ref: `dijjlppdljpcgyoakdnq` |
| 5 | `VITE_DASHBOARD_API_KEY` | All apps | Bearer auth for all `/api/*` routes in the os-backend | **`dashboard/.env.local` ⚠️ COMMITTED** | `online-local/.env.local`, `online-local/.env` | Generate new 32+ char random string → update all three files |
| 6 | `OMNIROUTE_API_KEY` | os-backend + Hermes | JWT for OmniRoute gateway at `45.79.180.236:20128` | `os-backend/.env` | `~/.hermes/.env` | OmniRoute admin panel on Linode; update both files after |
| 7 | `OMNIROUTE_WS_BRIDGE_SECRET` | os-backend | WebSocket session/bridge secret; most sensitive in the set | `os-backend/.env` | None | OmniRoute gateway `server.env`; no overlap window — cut over clean |
| 8 | `OMNIROUTE_BASE_URL` | os-backend + Hermes | Gateway base | `os-backend/.env` | `~/.hermes/.env` | `http://45.79.180.236:20128` (self-hosted, Linode) |
| 9 | `OMNIROUTE_MODEL` | os-backend + Hermes | Default model | `os-backend/.env` | `~/.hermes/.env` | Set in OmniRoute admin |
| 10 | `VERTEX_API_KEY` | os-backend | Gemini express-mode auth for `gen-lang-client-0756039230` | `os-backend/.env` | **archive/backend-clean/.env** (same value ✓) | GCP Console → APIs & Services → Credentials → API key → Rotate |
| 11 | `GEMINI_API_KEY` | os-backend | Direct Gemini public API fallback | `os-backend/.env` | None | GCP Console → APIs & Services → Credentials → API key → Rotate |
| 12 | `OPENROUTER_API_KEY` | online-local only | OpenRouter premium fallback — dead in os-backend | `online-local/.env.local` | None | openrouter.ai → Settings → API Keys → Rotate |
| 13 | `BREVO_API_KEY` | os-backend | Email send via Brevo | `os-backend/.env` | None | Brevo → Settings → SMTP & REST API → Regenerate |
| 14 | `NOTION_API_KEY` | os-backend | Notion OS sync (8 databases) | `os-backend/.env` | None | notion.so → My Integrations → select integration → Regenerate token |
| 15 | `GUMROAD_API_KEY` | os-backend + online-local | Gumroad product management and analytics | `os-backend/.env` | `online-local/.env.local` | gumroad.com → Account → API Access → Regenerate |
| 16 | `DASHBOARD_API_KEY` (server-side alias) | os-backend | Server-side fallback for `x-api-key` checks | `os-backend/.env` | None | Same as #5 — this is the server-side copy |
| 17 | `API_KEY_SECRET` | os-backend | API-key management secret | `os-backend/.env` | None | Generate new → update os-backend `.env` |
| 18 | `VERCEL_OIDC_TOKEN` | online-local | Vercel deployment token | `online-local/.env.local` | `os-backend/.env.local`, `dashboard/.env.dashboard` | ⚠️ **3 DIFFERENT values — each file has its own token** |
| 19 | `FIRECRAWL_API_KEY` | os-backend | Web scraping for intelligence pipeline | `os-backend/.env` | None | firecrawl.dev → API Keys → Regenerate |
| 20 | `EXA_API_KEY` | os-backend | Search engine for intelligence pipeline | `os-backend/.env` | None | exa.ai → API Keys → Regenerate |
| 21 | `AGENTOPS_API_KEY` | os-backend | LLM observability and tracing | `os-backend/.env` | None | agentops.ai → Settings → API Keys → Regenerate |
| 22 | `TELEGRAM_BOT_TOKEN` | os-backend | Telegram bot for notifications | `os-backend/.env` | None | @BotFather → `/revoke` → new token |
| 23 | `JWT_SECRET` | os-backend | JWT signing secret | `os-backend/.env` | None | Generate new 32+ char random → update; all existing sessions invalidated |
| 24 | `NOTION_WEBHOOK_SECRET` | os-backend | Webhook signature verification | `os-backend/.env` | None | Generate new → update; verify webhook before cutting over |
| 25 | `STORAGE_ENCRYPTION_KEY` | os-backend | Storage encryption at rest | `os-backend/.env` | None | Generate new AES-256 key → update; re-encrypt all stored data |
| 26 | `THREADS_ACCESS_TOKEN` | os-backend | Meta Threads posting | `os-backend/.env` | None | Meta Developer → App → Tools → Access Token Debugger → Extend/Rotate |
| 27 | `TWITTER_BEARER_TOKEN` | os-backend | Twitter/X API v2 | `os-backend/.env` | None | developer.twitter.com → Project → Keys and tokens → Regenerate |
| 28 | `FACEBOOK_ACCESS_TOKEN` | os-backend | Facebook posting | `os-backend/.env` | None | Meta Developer → Access Token Tool → Regenerate |
| 29 | `INSTAGRAM_ACCESS_TOKEN` | os-backend | Instagram Graph API | `os-backend/.env` | None | Extended via Meta Marketing API — rotate via Graph API Explorer |
| 30 | `GOOGLE_APPLICATION_CREDENTIALS` | os-backend | ADC service account key (file path) | filesystem: `C:\Users\frank\AppData\Roaming\gcloud\application_default_credentials.json` | None | GCP Console → IAM → Service Accounts → Keys → Create; then update path in env |
| 31 | `GOOGLE_CLOUD_PROJECT` | os-backend | GCP project for knowledge layer | `os-backend/.env` | None | Project ref `eminent-clock-509216-e0` — not a secret |
| 32 | `VERTEX_PROJECT_ID` | os-backend | Vertex AI project (currently `gen-lang-client-0756039230`) | `os-backend/.env` | None | ⚠️ Different from GOOGLE_CLOUD_PROJECT — reconcile before spending credits |
| 33 | `CLOUDFLARE_API_TOKEN` | not configured | Not yet set — zero Cloudflare vars anywhere | None | None | Cloudflare → My Profile → API Tokens → Create scoped token |
| 34 | `MACHINE_ID` | os-backend | OmniRoute machine binding | `os-backend/.env` | None | Set in OmniRoute gateway; not user-rotatable |

---

## Findings

### F5 — `VERCEL_OIDC_TOKEN` has 3 different values in 3 files
Three Vercel deployment tokens exist, each scoped to one Vercel project. The prefixes differ (JWT body starts different — `eyJ...` but the body decodes to different project refs). Do not rotate blindly — each token is tied to a specific project.

| File | Token length | Interpretation |
|---|---|---|
| `os-backend/.env.local` | 1406 chars | Vercel OIDC for os-backend |
| `dashboard/.env.dashboard` | 1339 chars | Vercel OIDC for dashboard |
| `online-local/.env.local` | 1351 chars | Vercel OIDC for online-local |

All three should be rotated **together** when rotating Vercel, but each requires a separate rotation action in the Vercel dashboard.

### F6 — `VITE_DASHBOARD_API_KEY` has 3 different values across repos
- `dashboard/.env.local` (committed): **24 chars** — the production value
- `online-local/.env.local`: **13 chars** — legacy/dev value
- `online-local/.env`: **13 chars** — legacy/dev value

These are **three different credentials**, not the same one in three places. The dashboard's committed value (24 chars) is the authoritative production key. The 13-char values in online-local are stale and should be removed or updated to match.

### F7 — `VITE_SUPABASE_ANON_KEY` has 3 different values
- `dashboard/.env.local` (committed): **208 chars** — production Supabase anon key
- `online-local/.env.local`: **13 chars** — stale/dev placeholder
- `online-local/.env`: **13 chars** — stale/dev placeholder

Acceptable: anon keys are public by design. But online-local should be updated to the real key for consistency.

### F8 — `VERTEX_API_KEY` is the only confirmed duplicate by value
SHA-256 hash confirms the same value exists in:
- `os-backend/.env` ✓ (correct)
- `archive/backend-clean/.env` (archive; acceptable)

No action needed on this one — the archive file is expected to contain an old-but-matching copy.

### F9 — OmniRoute credentials in 2 locations
`OMNIROUTE_API_KEY`, `OMNIROUTE_BASE_URL`, `OMNIROUTE_MODEL` all appear in `os-backend/.env` **and** `~/.hermes/.env`. Same values (confirmed by hash comparison). Rotating requires updating both files.

`~/.hermes/.env` also contains:
- `BUZZ_CLI_PATH` (path, not secret)
- `BUZZ_PRIVATE_KEY` (Buzz CLI auth — **should be reviewed for exposure**)
- `BUZZ_RELAY_URL` (URL, not secret)

### F10 — No GitHub Actions secrets found
Zero GitHub Actions workflows in any of the three main repos. No secrets exposed via CI.

---

## Rotation Priority

| # | Action | Why | Command / Steps |
|---|---|---|---|
| 1 | Rotate `VITE_DASHBOARD_API_KEY` | Shipped to every browser **and** in git | Generate 32+ char random → update `dashboard/.env.local` + both online-local files |
| 2 | Untrack `dashboard/.env.local` | Already on `origin/main`; cannot history-scrub without rewriting all commit SHAs | `git rm --cached .env.local` + commit; warn: file still in git history |
| 3 | Rotate `OMNIROUTE_WS_BRIDGE_SECRET` | Session/bridge secret with no overlap window; only copy in `os-backend/.env` | OmniRoute gateway `server.env` → restart gateway → verify WS connection |
| 4 | Reconcile `VERTEX_PROJECT_ID` vs `GOOGLE_CLOUD_PROJECT` | Credits will burn on wrong project | Set `VERTEX_PROJECT_ID=eminent-clock-509216-e0` to match |
| 5 | Update online-local `VITE_DASHBOARD_API_KEY` | 13-char stale value is different from 24-char production | Sync to production value |
| 6 | Rotate Vercel OIDC tokens (all 3) | Each tied to one project; rotate in Vercel dashboard | Vercel → Settings → Tokens → rotate each |
| 7 | Rotate `SUPABASE_SERVICE_ROLE_KEY` | Full DB bypass; currently correctly named in config (fixed F2) | Supabase Dashboard → API → Reset service_role |
| 8 | Review `BUZZ_PRIVATE_KEY` in `~/.hermes/.env` | Buzz CLI auth key not audited yet | Check Buzz dashboard for last-used / revoke if stale |

---

## Enforcement Rules

1. **No production secret in a committed file.** If `.env*` is git-tracked, it contains a placeholder.
2. **`VITE_` prefix = browser-visible.** Only `VITE_SUPABASE_ANON_KEY` and URLs may be prefixed `VITE_`. Never `VITE_DASHBOARD_API_KEY` in a production client bundle.
3. **One credential = one canonical location.** Archive copies are excluded from this rule.
4. **Rotation requires updating all consumers.** OmniRoute, Supabase, and Vercel tokens each appear in multiple files — miss one and the old key still works.
5. **No secrets in documentation.** `INTEGRATION_INVENTORY.md`, `docs/`, `public/SETUP-INSTRUCTIONS.md` — verify all example values are placeholders, not live keys.