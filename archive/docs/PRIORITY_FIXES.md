# Priority Fixes — Audit Log (updated 2026-11-10)
# See also: scripts/api-key-healthcheck.mjs (run to re-probe live keys anytime)

## Fixed #2: Neutralized stale .env.local in os-backend ✅
**What was broken:** `digitallydefined-os-backend/.env.local` contained:
- `OMNIROUTE_BASE_URL=https://ai.digitallydefined.online/v1` — decommissioned host, returns connection failure
- `OMNIROUTE_API_KEY=sk-952d12...` — different from canonical `sk-954ba6...` in `.env`; would return 401 against local container

If dotenv loaded this file after `.env`, local OmniRoute would silently break.

**What I did:** Replaced all live values with an explanatory comment header (file stays on disk for forensic reference). The file now reads:

```
# Stale env override — RENAMED 2026-11-10
# Original: .env.local (created by Vercel CLI)
# Reason: Line 19 pointed OMNIROUTE_BASE_URL at https://ai.digitallydefined.online/v1
#         (decommissioned host). Line 18 had a different OMNIROUTE_API_KEY than
#         the canonical key in .env. dotenv precedence could silently break local dev.
# Canonical keys now live only in:
#   - digitallydefined-os-backend/.env            (local Docker + FastAPI)
#   - ~/.hermes/.env                              (Hermes MCP — same valid key)
# Delete this file after confirming everything works from .env.
```

**Verified recovery:** After neutralization, `dotenv.config()` picks up only `.env` → `OMNIROUTE_BASE_URL=http://localhost:20128/v1` (correct), `OMNIROUTE_API_KEY=sk-954ba6...` (canonical key). Local Dev now works again.

**Next step:** Once confirmed healthy for ≥7 days, delete the file entirely.

---

