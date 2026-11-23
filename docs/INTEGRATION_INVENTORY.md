# Integration Credential Inventory

**Scope:** every third-party integration that holds a credential for DigitallyDefined.
**Verified:** 2026-10-18, by reading live `.env` files and code references on this machine.
**Secret values are deliberately absent.** Only variable *names*, value *lengths*, and
git-tracking status are recorded.

> **This file never contains a secret value.** It is committed to git. It records
> *where* credentials live and *how to rotate* them — not the credentials themselves.

---

## 0. Security findings (read first)

### F1 — `digitallydefined-dashboard/.env.local` is committed to git and pushed

`.gitignore` line 7 lists `.env*`, which **should** exclude it. The file was already
tracked before that rule landed, and git keeps tracking files it has committed once.

| Variable | State | Length | Classification |
|---|---|---|---|
| `VITE_SUPABASE_URL` | FILLED | 40 | Not a secret (project URL) |
| `VITE_SUPABASE_ANON_KEY` | FILLED | 208 | **Public by design** — `VITE_` vars are bundled into client JS; anon keys are protected by RLS |
| `VITE_DASHBOARD_API_KEY` | FILLED | 24 | **Real secret.** A bearer token shipped to the browser *and* committed |
| `VITE_API_URL` | FILLED | 46 | Not a secret (backend URL) |

Confirmed present in `origin/main`. Last three commits touching it: `5fe21b14`, `fd4f71ae`, `84755acf`.

**Why this matters:** any `VITE_` variable is readable by anyone who loads the dashboard.
The anon key is *meant* to be public. The dashboard API key is not — it is a server-side
credential being handed to browsers, so it is exposed to every visitor regardless of git,
and additionally exposed to anyone with repo read access.

**Remediation (order matters):**

1. Rotate the key at the source — treat the current value as compromised.
2. `git rm --cached .env.local` then commit.
3. Untrack historically if the repo has ever been public:
   `git filter-repo --path .env.local --invert-paths`
4. Fix the ordering bug that caused it: `.gitignore` listed `.env` on line 4 and
   `.env*` on line 7, but the file was committed before either rule applied.

### F2 — `SUPABASE_SERVICE_KEY` does not exist in any env file

`fastapi/app/config/supabase.py` reads `SUPABASE_SERVICE_KEY`. The actual variable in
`.env` is `SUPABASE_SERVICE_ROLE_KEY`. The lookup therefore always returns empty, so
`is_configured()` reports `False` and the service-role path is dead.

`fastapi/app/deps.py:39` logs the same wrong name, so the warning would misfire too.

Fixed in `config/supabase.py` to read the real name first and accept the old one as a
fallback. `deps.py` is untouched (its message is diagnostic only).

### F3 — Two integrations are referenced by code but configured nowhere

**Cloudflare** and **OpenRouter** are read by code paths but have **zero** variables in
any `.env` file in the workspace. Both fall through to "not configured" at runtime.
They are documented below as *ready to configure*, not as *working*.

### F4 — Credential spread across four locations

No single source of truth. OmniRoute keys exist in `os-backend/.env` **and**
`~/.hermes/.env` **and** Vercel project env vars. Rotation must cover all three or the
old key survives in one place.

---

## 1. Supabase

| | |
|---|---|
| **Purpose** | Primary database, auth, storage, and Edge Functions. Host of 13 live Edge Functions including `hermes`, `backend-hermes`, `sellable`, `followup`, `post-publisher`, `sync`, `analytics`, `optimization-loop`. |
| **Project ref** | `dijjlppdljpcgyoakdnq` |
| **URL** | `https://dijjlppdljpcgyoakdnq.supabase.co` |
| **Auth method** | Static API keys (bearer). No OAuth flow. Three distinct keys with very different risk. |
| **Permissions needed** | `service_role` → full bypass of RLS. Use only server-side. `anon` → RLS-constrained; safe to ship to a browser *only* if RLS is actually enabled on every table. |

### Environment variables

| Variable | Where | Notes |
|---|---|---|
| `SUPABASE_URL` | `os-backend/.env` | Present, untracked |
| `SUPABASE_ANON_KEY` | `os-backend/.env` | Present, untracked |
| `SUPABASE_SERVICE_ROLE_KEY` | `os-backend/.env` | Present, untracked — **full database access** |
| `VITE_SUPABASE_URL` | `dashboard/.env.local` | **Committed** (F1) |
| `VITE_SUPABASE_ANON_KEY` | `dashboard/.env.local` | **Committed** (F1) — acceptable, `VITE_` is public by design |

### Rotation procedure

1. Supabase dashboard → **Project Settings → API**.
2. **service_role** → *Reset*. Immediately update `SUPABASE_SERVICE_ROLE_KEY` in
   `os-backend/.env` **and** every Vercel project that calls Supabase. The old key dies
   instantly — there is no overlap window, so update all consumers before restarting.
3. **anon/public** → *Reset*. Update `SUPABASE_ANON_KEY`, then rebuild the dashboard
   (the value is compiled into the bundle). Any user holding a stale tab breaks until
   hard-refresh.
4. Verify: `GET {SUPABASE_URL}/rest/v1/<table>` with `apikey` + `Authorization` headers,
   expecting HTTP 200 — not 401.

### Minimum viable permissions

Never ship `SUPABASE_SERVICE_ROLE_KEY` to a client, and never prefix it with `VITE_`.
Backend-only, server-side environments exclusively.

---

## 2. Cloudflare

| | |
|---|---|
| **Purpose** | Edge delivery, CDN, Workers, WAF/security. Per the OS architecture rules, Cloudflare owns delivery and edge compute and the OS backend does **not** duplicate it. |
| **Status** | **Not configured.** Zero Cloudflare variables exist in any env file. Only `fastapi/app/config/cloudflare.py` reads them (written during the GCP audit). |
| **Auth method** | Scoped API Tokens (recommended) or the legacy Global API Key. **Use scoped tokens only.** |
| **Permissions needed** | Workers → *Edit* on the Workers Scripts scope. R2 → *Edit* on the specific bucket only. DNS → *Edit* scoped to one zone. Never grant Account-wide Settings or Billing. |

### Environment variables (defined in code, currently empty)

| Variable | Purpose |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Account identifier — dashboard sidebar, or zone overview page |
| `CLOUDFLARE_API_TOKEN` | Scoped API token |
| `R2_BUCKET_PRODUCTS` | Product asset bucket (default name `digitallydefined-products`) |
| `R2_BUCKET_ASSETS` | Asset bucket (default name `digitallydefined-assets`) |
| `R2_PUBLIC_URL` | Public asset CDN origin |
| `WORKER_SYNC_URL` | Sync worker endpoint |
| `WORKER_PUBLISH_URL` | Publish worker endpoint |

### Where to find the credentials

- **Account ID:** Cloudflare dashboard → any domain → *Overview* → right sidebar → *Account ID*.
- **API token:** Cloudflare dashboard → **My Profile → API Tokens → Create Token**.
  Use the *Edit Cloudflare Workers* template, then narrow it further by scoping the
  token to one account and one zone.
- **R2 credentials:** same token mechanism. R2 needs its own S3-compatible endpoint
  (`https://<account_id>.r2.cloudflarestorage.com`) and access key pair, which are
  *not* the same as the API token.

### Rotation procedure

1. Create the **new** token first, with identical minimal scope. Do not delete the old one yet.
2. Update `CLOUDFLARE_API_TOKEN` everywhere it is consumed, then redeploy.
3. Confirm Workers invocations still succeed.
4. Only then revoke the old token under *My Profile → API Tokens*.

Order matters — deleting first causes an immediate edge outage with no rollback.

---

## 3. Google Cloud

| | |
|---|---|
| **Purpose** | Gemini via Vertex AI, Firestore knowledge base, BigQuery analytics, Cloud Storage for large artifacts, long-running batch processing. |
| **Project** | `eminent-clock-509216-e0` — the knowledge/analytics project |
| **Legacy project** | `gen-lang-client-0756039230` — still referenced by existing Vertex config; see the mismatch note below |
| **Region** | `us-central1` |
| **Auth method** | **ADC (Application Default Credentials) preferred.** Falls back to an API key in express mode. No long-lived key should be stored where ADC works. |

### Project mismatch (unresolved)

`VERTEX_PROJECT_ID` in `os-backend/.env` points at `gen-lang-client-0756039230`, while
`GOOGLE_CLOUD_PROJECT` defaults to `eminent-clock-509216-e0`. Two projects are live
in one config file. Vertex quota on the legacy project is currently exhausted
(per `src/config/models.js`), which is why `vertex/*` entries are marked `degraded`.
**Decide which project owns Vertex before spending credits**, or you will exhaust
quotas on the wrong one.

### Environment variables

| Variable | Where | Notes |
|---|---|---|
| `GOOGLE_CLOUD_PROJECT` | `.env.example` only | Not yet in `.env` |
| `GOOGLE_CLOUD_LOCATION` | `.env.example` only | Not yet in `.env` |
| `VERTEX_PROJECT_ID` | `os-backend/.env` | Legacy project — see above |
| `VERTEX_LOCATION` | `os-backend/.env` | |
| `VERTEX_API_KEY` | `os-backend/.env` | Express-mode key; bypasses ADC entirely |
| `VERTEX_MODEL` | `os-backend/.env` | |
| `FIRESTORE_DATABASE` | `.env.example` | `(default)` |
| `STORAGE_BUCKET` | `.env.example` | |
| `BIGQUERY_DATASET` | `.env.example` | |
| `AGENTOPS_API_KEY` | `os-backend/.env` | LLM observability/tracing |

ADC file: `C:\Users\frank\AppData\Roaming\gcloud\application_default_credentials.json`
— confirmed present and valid; the Firestore API is now enabled on the project.

### Where to find the credentials

- **ADC (recommended, no key at all):**
  `gcloud auth application-default login`
  ⚠️ **In this environment the `gcloud` launcher is broken under MSYS** — it rewrites
  its own internal Python path to `C:\c\Users\...` and dies with `No such file or
  directory`; `cmd //c` opens an interactive banner instead of executing. You ran the
  ADC login successfully from **PowerShell** — use PowerShell, not this shell, for any
  `gcloud` command.
- **Service account key:** GCP console → *IAM & Admin* → *Service Accounts* → create →
  JSON key. Use only when a runtime cannot do ADC (e.g. a bare Vercel function).
- **API key:** *APIs & Services → Credentials → Create credentials → API key*.
  Restrict it: *API restriction* to Vertex AI / Firestore as applicable, plus
  *IP restriction* or *HTTP referrer restriction*.

### Minimum permissions for a service account

| Role | Grants |
|---|---|
| `roles/aiplatform.user` | Invoke Vertex AI models |
| `roles/datastore.user` | Read/write Firestore |
| `roles/bigquery.jobUser` | Run BigQuery jobs (data access is separate) |
| `roles/storage.objectAdmin` | Read/write objects — **only** if Storage is actually used |
| `roles/secretmanager.secretAccessor` | Read secrets — **only** if pulling from Secret Manager |

Do **not** grant `roles/owner`, `roles/editor`, or `roles/iapc.serviceUsageUser`
beyond what a one-time API enable needs.

### Rotation procedure

**ADC (preferred):** `gcloud auth application-default login` in PowerShell. Re-issue
periodically or on suspected exposure; no code change required.

**Service account key:**
1. Create key #2 on the same service account (existing key keeps working).
2. Deploy with key #2. Verify.
3. Delete key #1 under *Service Accounts → key → Delete*.
4. Update any copy in a secrets manager — local `.env` files are not the only copy.

**API key:** create → restrict → deploy → delete old in the console. Restriction
changes apply within minutes; check *Credentials* for propagation status first.

---

## 4. OpenRouter

| | |
|---|---|
| **Purpose** | Paid fallback provider when Gemini/OmniRoute are unavailable. Used for premium-tier reasoning when the Gemini-first router escalates. |
| **Status** | **Not configured in `os-backend`.** `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` are read by `src/config/env.js`, `src/services/ai.js`, and `src/services/aiRouter.js`, and the var **does** exist in `digitallydefined-online-local/.env.local`. |
| **Auth method** | Static bearer token. |
| **Permissions needed** | Account-scoped key with a hard usage limit. OpenRouter keys have no fine-grained scopes, so the **usage limit is the only permission control.** |

### Environment variables

| Variable | Where | Status |
|---|---|---|
| `OPENROUTER_API_KEY` | `online-local/.env.local` (untracked) | Present |
| `OPENROUTER_API_KEY` | `os-backend/.env` | **Absent** — OpenRouter fallback is dead there |
| `OPENROUTER_MODEL` | referenced in code, not set anywhere | Defaults to `openai/gpt-4o-mini` |

### Where to find the credentials

openrouter.ai → **Settings → API Keys → Create Key**. Set a monthly credit limit on the
key at creation — this is the only safeguard OpenRouter offers.

### Rotation procedure

1. Create the new key.
2. Update `OPENROUTER_API_KEY` in every consuming repo **and** Vercel.
3. Verify a call succeeds with the new key.
4. Revoke the old key under *Settings → API Keys*.

Because keys have no scopes, rotation is the *only* way to revoke access. Treat it as
routine, not an incident response.

---

## 5. OmniRoute

| | |
|---|---|
| **Purpose** | Local AI gateway for local (on-machine) traffic. Routes to upstream providers to preserve free credits. Verified live: HTTP 200 with **6,866 models** in its catalog. Production (Vercel) does **not** use OmniRoute — it uses the direct Gemini provider, because OmniRoute is not reachable off-host. |
| **Endpoint** | Local Docker container, `http://localhost:20128/v1` (published on `127.0.0.1:20128` only). **No public endpoint, no Cloudflare tunnel.** |
| **Auth method** | JWT bearer token, plus a WebSocket bridge secret for the CLI/bridge path. |
| **Permissions needed** | Gateway token. Scope is defined inside OmniRoute itself, not by the token — restrict by model allowlist and rate limit on the gateway side. |

### Environment variables

| Variable | Where | Notes |
|---|---|---|
| `OMNIROUTE_API_KEY` | `os-backend/.env`, `~/.hermes/.env` | JWT bearer — **in two places** |
| `OMNIROUTE_BASE_URL` | `os-backend/.env`, `~/.hermes/.env` | Gateway base |
| `OMNIROUTE_MODEL` | `os-backend/.env`, `~/.hermes/.env` | `auto` |
| `OMNIROUTE_WS_BRIDGE_SECRET` | `os-backend/.env` | **Bridge/session secret — most sensitive of the set** |
| `OMNIROUTE_CLI_URL` | `os-backend/.env` | |
| `MACHINE_ID` | `os-backend/.env` | Machine binding |
| `OMNIROUTE_MACHINE_ID`, `OMNIROUTE_WS_URL`, `OMNIROUTE_DASHBOARD_URL`, `OMNIROUTE_FALLBACK_MODELS`, `OMNIROUTE_TIMEOUT_MS` | referenced in code | Not set |
| `AI_MODEL_CHAT/REASONING/CODING/VISION/JSON/FAST/FALLBACK` | referenced in `aiRouter.js` | Per-job model overrides, all unset |

### Where to find the credentials

OmniRoute is self-hosted, so credentials are minted **on the gateway**, not on a public
website. Regenerate the gateway/API token in the OmniRoute admin panel on the Linode
box. `OMNIROUTE_WS_BRIDGE_SECRET` is configured in the gateway's `server.env` — it is
server-side config and must never be returned to a client.

### Rotation procedure

**This one has three locations and will silently half-fail if you miss one.**

1. Regenerate the gateway token in the OmniRoute admin panel.
2. Update **all three**, or the old key survives:
   - `~/Documents/DigitallyDefinedClean/digitallydefined-os-backend/.env`
   - `C:\Users\frank\.hermes\.env`
   - Vercel project environment variables (any project calling the backend)
3. Restart Hermes and redeploy Vercel.
4. Rotate `OMNIROUTE_WS_BRIDGE_SECRET` in the gateway `server.env` **separately** — it
   is not affected by rotating the API key, and forgetting it breaks the CLI/bridge path.
5. Verify with `GET {OMNIROUTE_BASE_URL}/models` → expect HTTP 200.

---

## 6. Docker Agentic Platform

| | |
|---|---|
| **Purpose** | Intended host for long-running agent processes, scheduled jobs, and the agent runtime — the work that does not fit a serverless function. |
| **Status** | **Nothing exists.** No `Dockerfile`, no compose file, no `DOCKER_*` / `AGENTIC` / `REGISTRY_*` / `COMPOSE_*` variables anywhere. Integration is entirely greenfield. |
| **Local Docker** | Docker Desktop 29.8.0, context `desktop-linux`, daemon reachable and responding. Fully working for local build/run with **zero credentials**. |
| **Auth method** | *Local:* none required. *Hosted registry:* registry-specific PAT. |
| **Permissions needed** | Local → none. Private image pull → read-only PAT scoped to one namespace. Image push → write PAT, same namespace. Hosted platform org access → **avoid**; it is effectively admin. |

### Credential storage (important nuance)

`~/.docker/config.json` shows `auths: []` **and** `credsStore: desktop`. These are not
contradictory: when a credential helper is configured, Docker intentionally leaves
`auths` empty and delegates to the OS keychain. **An empty `auths` block is inconclusive
and does not prove you have never logged in.**

| Location | Contents |
|---|---|
| `C:\Users\frank\.docker\config.json` | `credsStore: desktop`, `currentContext: desktop-linux`. Holds no secrets itself |
| OS keychain via `docker-credential-desktop` | The actual registry credential store |
| `C:\Users\frank\.docker\.token_seed` (74 bytes) + `.lock` | Docker Desktop internal token seed. **Not a registry credential — never share it** |
| `C:\Users\frank\.docker\daemon.json`, `windows-daemon.json` | Local daemon config, not auth |
| `~/.docker/cagent/`, `mcp/`, `contexts/`, `models/`, `modules/` | Agent/MCP tooling state, not auth |

### Environment variables

**None.** No Docker or agentic-platform variable exists in any `.env` file.

### ⚠️ Do not confuse this with Devin

OmniRoute logs reference a `devin-cli-agentic` provider
(`devin acp → model=swe-1-7`, failing with `DEVIN_AGENTIC_HOME must be an absolute path
inside the bridge sandbox`). That is **Devin's** agentic CLI reached over ACP through
OmniRoute — a separate product with separate credentials, and unrelated to Docker.

### Where to find the credentials

- **Local:** nowhere needed. `docker build` and `docker run` work as-is.
- **Registry:** `docker login <registry>` — credentials go to the OS keychain, never to a
  file in the repo. Docker Hub: hub.docker.com → *Account Settings → Access Tokens*.
- **Hosted platform:** ⚠️ **unverified.** A product named "Docker Agentic Platform" could
  not be confirmed to exist under that name, so its auth flow and any org/project ID
  requirement are **unknown**. Do not provision credentials for it until the product is
  positively identified.

### Rotation procedure

- **Local:** nothing to rotate.
- **Registry PAT:** Docker Hub → revoke old token → `docker logout` → `docker login`
  with the new token. Also remove the old entry from the keychain helper.
- ⚠️ Because the MSYS shell breaks `gcloud`, expect an interactive `docker login`
  prompt driven from this shell to fail the same way. **If a login is needed, run it
  yourself from PowerShell** — the exact command will be provided on request.

---

## 7. Credential-to-location map

| Integration | Credential | `os-backend/.env` | `~/.hermes/.env` | Vercel | Git-tracked? |
|---|---|---|---|---|---|
| Supabase | `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | ✅ | No |
| Supabase | `VITE_SUPABASE_ANON_KEY` | — | — | dashboard repo | ⚠️ **Yes** (F1) |
| Supabase | `VITE_DASHBOARD_API_KEY` | — | — | dashboard repo | ⚠️ **Yes — real secret** (F1) |
| Cloudflare | `CLOUDFLARE_API_TOKEN` | ❌ unset | — | ❌ | No |
| Google Cloud | ADC file | filesystem | — | ❌ | No |
| Google Cloud | `VERTEX_API_KEY` | ✅ | — | ✅ | No |
| OpenRouter | `OPENROUTER_API_KEY` | ❌ unset | — | ❌ | No (set only in `online-local`) |
| OmniRoute | `OMNIROUTE_API_KEY` | ✅ | ✅ | ✅ | No |
| OmniRoute | `OMNIROUTE_WS_BRIDGE_SECRET` | ✅ | — | ❌ | No |
| Docker | — | ❌ n/a | — | ❌ | No |

---

## 8. Rotation priority

Ordered by exposure × ease of compromise.

| # | Action | Why |
|---|---|---|
| 1 | Rotate `VITE_DASHBOARD_API_KEY` | Shipped to every browser **and** committed to git |
| 2 | `git rm --cached .env.local` + history scrub | Repo already contains it on `origin/main` |
| 3 | Rotate `OMNIROUTE_WS_BRIDGE_SECRET` | Session/bridge secret, only copy, no rotation schedule |
| 4 | Rotate `SUPABASE_SERVICE_ROLE_KEY` | Full DB bypass; also fixes the F2 name mismatch |
| 5 | Reconcile the two GCP projects | Credits will burn on the wrong project otherwise |
| 6 | Add `OPENROUTER_API_KEY` to `os-backend` with a hard usage cap | Fallback path is currently dead |
| 7 | Provision a scoped Cloudflare token | Never use the Global API Key |
| 8 | Move all secrets into one manager | Four locations today; rotation misses are inevitable |

---

## 9. Standing rules

1. **No secret values in this file, or any committed file, ever.**
2. **`VITE_` prefix means public.** If a `VITE_` variable must never be seen by a
   visitor, it does not belong in a Vite bundle — move the check server-side.
3. **Prefer ADC and short-lived tokens** over static keys wherever the runtime allows.
4. **Rotate least-privilege tokens on a schedule**, not only on exposure — OpenRouter
   keys have no scopes, so revocation is the only access control they offer.
5. **One env file is not one credential store.** Check the location map in §7 before
   declaring a rotation complete.