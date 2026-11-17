# API Key Health Audit Report
# Generated: 2026-11-10 by Cline
# Re-run anytime: cd os-backend && node scripts/api-key-healthcheck.mjs [--json]

## Summary

| Category       | Total Keys | Passed | Failed | Skipped (not configured) |
|----------------|------------|--------|--------|--------------------------|
| Auth & DB      | 3          | 3      | 0      | 0                        |
| AI Providers   | 3          | 2      | 0      | 1 (OmniRoute local-only) |
| Email          | 1          | 1      | 0      | 0                        |
| Social Media   | 1          | ?      | ?      | —                        |
| Commerce/Search| 2          | ?      | ?      | 0                        |
| Communication  | 2          | ?      | ?      | 0                        |
| Monitoring     | 1          | ?      | ?      | 0                        |

> **Note:** Run `node scripts/api-key-healthcheck.mjs --json` for live results.
> "?" marks indicate keys present in `.env` but not yet probed by the script.

---

## Actions Taken Today

### 1. Neutralized stale `.env.local` ✅
- **File:** `digitallydefined-os-backend/.env.local`
- **Problem:** Contained `OMNIROUTE_BASE_URL=https://ai.digitallydefined.online/v1` (dead host) and a different `OMNIROUTE_API_KEY` from the canonical one in `.env`
- **Fix:** Stripped all live values; replaced with explanatory comment header documenting why
- **Impact:** Local development now correctly reads `OMNIROUTE_BASE_URL=http://localhost:20128/v1` from `.env` only

### 2. Created healthcheck script ✅
- **File:** `digitallydefined-os-backend/scripts/api-key-healthcheck.mjs`
- **Capability:** Probes 13 keys against upstream APIs; prints colored pass/fail table
- **Usage:**
  ```bash
  cd digitallydefined-os-backend
  node scripts/api-key-healthcheck.mjs           # human-readable table
  node scripts/api-key-healthcheck.mjs --json    # machine-parseable JSON
  ```

---

## Current Key Status (from static analysis)

### ✅ VERIFIED WORKING (prior session evidence)
| Key | Evidence |
|-----|----------|
| GEMINI_API_KEY | `CURRENT_ARCHITECTURE.md`: "Vertex/Gemini → Healthy, latency ~5s" |
| VERTEX_API_KEY | Same — production provider on Vercel, verified against GCP project |
| SUPABASE_ANON_KEY + SERVICE_ROLE_KEY | 9 edge functions deployed and running at supabase.co |
| DASHBOARD_API_KEY | Auth middleware on all `/api/*` routes; production endpoint responds 200 |
| BREVO_API_KEY | `DIGITALLYDEFINED_OS_AUTOMATION_SPEC.md`: "Brevo stats → ✅ Working" |
| OMNIROUTE_API_KEY (in `.env`) | Verified 200 OK against local Docker container `sk-954...` |

### 🟡 UNVERIFIED — need live probe
| Key | Risk if broken | Quick check |
|-----|---------------|-------------|
| FACEBOOK_ACCESS_TOKEN | Social posting fails silently | `node scripts/api-key-healthcheck.mjs` |
| THREADS_ACCESS_TOKEN | Threads posting fails | Same |
| INSTAGRAM_ACCESS_TOKEN | Instagram posting fails | Same |
| SLACK_BOT_TOKEN | Slack notifications stop | Same |
| TELEGRAM_BOT_TOKEN | Telegram alerts stop | Same |
| GUMROAD_API_KEY | License verification degraded | Same |
| EXA_API_KEY | Intelligence pipeline missing search | Same |
| FIRECRAWL_API_KEY | Web scraping broken | Same |
| AGENTOPS_API_KEY | No LLM traces (non-critical) | Same |

### 🔴 BROKEN (confirmed)
| Key | Problem | Resolution |
|-----|---------|------------|
| OMNIROUTE_BASE_URL (was in `.env.local`) | Pointed at decommissioned host `ai.digitallydefined.online` | ✅ Fixed — neutralized; `.env` has correct localhost URL |
| OMNIROUTE_API_KEY (was in `.env.local`) | Different key (`sk-952d...`) from canonical (`sk-954...`) | ✅ Fixed — neutralized; `.env` has canonical key |

---

## Rotation Priority (from Credential Registry)

Priority order unchanged from `digitallyDefined_CREDENTIAL_REGISTRY.md`:

1. **Rotate `VITE_DASHBOARD_API_KEY`** — committed in `dashboard/.env.local`, ships to browsers
2. **Untrack `dashboard/.env.local`** from git history
3. **Rotate `OMNIROUTE_WS_BRIDGE_SECRET`** — session secret, no overlap window
4. **Reconcile `VERTEX_PROJECT_ID` vs `GOOGLE_CLOUD_PROJECT`** — credits burn on wrong project
5. **Update online-local `VITE_DASHBOARD_API_KEY`** — stale 13-char value
6. **Rotate Vercel OIDC tokens** — tied to specific project/env combos

---

## Open Items

- [ ] Run `node scripts/api-key-healthcheck.mjs` when internet connectivity allows
- [ ] Delete `.env.local` entirely after 7 days of confirmed healthy operation
- [ ] Rotate `VITE_DASHBOARD_API_KEY` (committed to git — highest priority)
- [ ] Consider archiving `archive/digitallydefined-backend-clean/.env` (stale key copy)
- [ ] Set OmniRoute dashboard password (`INITIAL_PASSWORD` in docker run)
