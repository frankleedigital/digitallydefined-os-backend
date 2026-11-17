# AUTOMATION REALITY REPORT — DigitallyDefined
**2026-11-13 · Every claim below was verified with a live call or file-level evidence. No estimates.**

## VERDICT SUMMARY
| Platform | Classification | Evidence |
|---|---|---|
| Facebook Group | **PARTIALLY WORKING** | auth live, read live, no publish wiring, no schedule |
| Facebook Page | **NOT CONFIGURED** | no page ID, no page token anywhere |
| Instagram | **CONFIGURED BUT DISCONNECTED** | env set, token invalid ("cannot parse") |
| Threads | **CONFIGURED BUT DISCONNECTED** | env set, token expired 28-Jul-26 |
| Pinterest | **NOT CONFIGURED** | zero keys, zero code |
| Scheduled posting | **NOT CONFIGURED** | pg_cron not installed on Supabase; no cron jobs exist |
| CF Worker automations | **UNVERIFIED (undeployed locally)** | no CF auth on this machine; agents draft only |

---
## 1. FACEBOOK GROUP — PARTIALLY WORKING
Account: group "DigitallyDefined" (id 1050373128164124), user token of **Francesca LaVigne** (fb id 927400646867328)
1. API configured: **YES** — FACEBOOK_GROUP_ID + FACEBOOK_ACCESS_TOKEN in local `.env` AND Vercel production env; code: `api/index.js` (fetchFacebookGroup) + `src/services/integrations.js` (postToFacebookGroup)
2. Auth working: **YES** — live GET `/v18.0/{group}?fields=id,name` → HTTP 200 `{"id":"1050373128164124","name":"DigitallyDefined"}`
3. Permissions: **read verified; publish scope NOT verifiable** — no FACEBOOK_APP_ID/SECRET in env, so token scopes cannot be introspected
4. Auto-publish today: **NO** — `postToFacebookGroup()` exists but NO action, route, or schedule calls it. Live `integration.social` endpoint returns "connected" purely because env vars are set.
5. Blocker: no trigger of any kind reaches the publish function.
6. Action required: expose a publish action (or cron) that calls the existing function with the group feed endpoint.

---
## 2. FACEBOOK PAGE — NOT CONFIGURED
1. API configured: **NO** — `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN` are both **empty** in local `.env` and **absent** from Vercel production.
2. Auth working: **N/A** (nothing to test)
3. Account: none connected
4. Auto-publish today: **NO**
5. Blocker: no Page token, no Page ID, and no Meta App ID/Secret to obtain one.
6. Action required: create a Facebook Page, obtain a Page Access Token with `pages_manage_posts`, set `FACEBOOK_PAGE_ID` + `FACEBOOK_PAGE_ACCESS_TOKEN` in Vercel. (The publish code `postToFacebookPage()` already exists.)

---
## 3. INSTAGRAM — CONFIGURED BUT DISCONNECTED
Account: INSTAGRAM_BUSINESS_ID (17 chars) + INSTAGRAM_USER_ID set in local `.env` and Vercel production.
1. API configured: **YES** (env vars present)
2. Auth working: **NO** — live GET `graph.instagram.com/me` → **HTTP 400, OAuthException 190 "Invalid OAuth access token - Cannot parse access token."** The token stored is malformed/corrupt, not just expired.
3. Permissions: **cannot verify** (token unparseable)
4. Auto-publish today: **NO** — **no live code POSTs to the Instagram Graph API anywhere** (zero `graph.instagram.com` publish calls in backend or workers).
5. Blocker: corrupt token + no publishing pipeline.
6. Action required: re-run Meta OAuth to regenerate a valid long-lived IG Business token, then add an IG media-publish call.

---
## 4. THREADS — CONFIGURED BUT DISCONNECTED
Account: THREADS_USER_ID + THREADS_APP_ID + THREADS_APP_SECRET set in local `.env` and Vercel production.
1. API configured: **YES** (env vars present)
2. Auth working: **NO** — live GET `graph.threads.net/v1.0/me` → **HTTP 400, "Session has expired on Tuesday, 28-Jul-26."** The token is a short-lived session token that was never exchanged to long-lived; it is ~3.5 months stale.
3. Permissions: **cannot verify** (expired)
4. Auto-publish today: **NO** — no live code POSTs to the Threads API (zero `graph.threads.net` publish calls).
5. Blocker: expired token + no publishing pipeline.
6. Action required: re-authenticate Threads, exchange for a long-lived token, add a Threads publish call.

---
## 5. PINTEREST — NOT CONFIGURED
1. API configured: **NO** — no `PINTEREST_*` variable exists in local `.env`, Vercel production, or the CF worker.
2–3. Auth/account: **N/A**
4. Auto-publish today: **NO** — zero references to `api.pinterest.com` in any code.
5. Blocker: nothing built — no app, no token, no code.
6. Action required: create a Pinterest App, obtain a personal/business access token, and implement a publisher. (None of this exists yet.)

---
## 6. META APP / FACEBOOK APP STATUS
**No app-level credentials exist anywhere.** `META_APP_ID`, `META_APP_SECRET`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` are all **MISSING** from local `.env` and Vercel production. Only *user-level* tokens are stored. Therefore the Meta App's review/approval status **cannot be verified** from this workspace — there is no App ID to look up.

---
## 7. CLOUDFLARE WORKER AUTOMATIONS — UNVERIFIED (not deployed on this machine)
- `digitallydefined-os-workers` is a local build (`wrangler.toml`, CF Agents + Durable Objects). It has local miniflare state only.
- **No Cloudflare auth exists on this machine** (no `.wrangler` credentials), so whether the worker is actually deployed/running **cannot be confirmed**.
- The `contentAgent` is a **draft generator only** — its own output says "Save to the Content Blocks DB in Notion. Schedule or publish." It never calls a social API.
- **Zero `graph.facebook` / `graph.instagram` / `threads.net` / `pinterest` calls exist anywhere in the worker's `src/`.** Even if deployed, it cannot publish.
- **No live system references the worker** — zero `workers.dev` URLs or `digitallydefined-os-workers` endpoints in the dashboard, backend, or `.env`. It is disconnected from the live ecosystem.
- Classification: **UNVERIFIED** for deployment; **NOT PUBLISHING** by code evidence.

---
## 8. CONTENT PUBLISHING AGENTS — NO ACTUAL PUBLISHER EXISTS
- The **only** component that touches publishing is the Supabase `post-publisher` edge function.
- **It does not call any social API.** It creates a roadmap entry with `status: "pending"` and writes it to a **filesystem** dir (`data/roadmaps/`), then returns "queued."
- That filesystem write is ephemeral (lost on function re-deploy/scale). There is no worker that picks up "pending" posts and publishes them.
- Conclusion: **the publishing agent produces queued/pending records; nothing actually publishes.**

---
## 9. SCHEDULED POSTING SYSTEMS — NOT CONFIGURED (no cron running)
- `post-publisher`, `followup`, `notion-sync`, `sellable` all *check* for a `supabase.cron.*` header, **but**:
- **`pg_cron` is NOT installed** on the Supabase project (`pg_extension` query returned 0 rows; `cron.job` relation does not exist).
- Therefore **no Supabase cron jobs can exist or run.** The cron header checks are dormant — nothing is scheduled.
- No other scheduler (system cron, Vercel cron, Cloudflare) is wired to post.
- Classification: **NOT CONFIGURED.**

---
## 10. SUPABASE TABLES FOR CONTENT SCHEDULING
- No content/post/campaign/schedule table exists. The only related tables found: `quiz_roadmaps` (customer roadmaps), `website_leads` (leads).
- `post-publisher`'s "scheduling" is **filesystem-based** (`data/roadmaps/*.json`), not a Supabase table. The single local entry (`1786806567214-kb5pkfe.json`, 2026-08-15) is a test record, not a real post.
- Conclusion: **there is no persistent content-scheduling table.**

---
## BOTTOM LINE (what actually works today)
- **Works:** Facebook Group read + user auth · Brevo contact API (200) · dashboard/backend live · GA4 tracking (production).
- **Configured but broken:** Instagram (corrupt token), Threads (expired token).
- **Not configured:** Facebook Page, Pinterest.
- **No automation:** There is **no working scheduled content-publisher.** "post-publisher" only queues pending records to a disposable filesystem; no cron, no pg_cron, no worker publishes. **Content is NOT published automatically on any platform today.**
