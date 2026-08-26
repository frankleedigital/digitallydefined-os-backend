# DigitallyDefined — verification plan for OmniRoute Linode integration
#
# Once the Linode JWT is pasted into the configs above, run these to confirm
# the whole chain works: Linode OmniRoute → backend → Hermes.
# =============================================================================

# =============================================================================
# STEP 0: Get the Linode JWT (one-time)
# =============================================================================
# SSH to the Linode and get the JWT that the Linode's OmniRoute accepts.
#
# Option A — from the dashboard (easiest):
#   1. Open https://<your-domain>/dashboard on the Linode
#   2. In the browser dev tools → Network tab, trigger a chat request
#   3. Find the /v1/chat/completions request
#   4. Copy the Authorization: Bearer <JWT> value
#   5. That JWT is what goes into OMNIROUTE_API_KEY (prefix it with sk- per
#      the backend's convention, OR use it bare if the Linode accepts bare JWTs)
#
# Option B — from the CLI env (if the Linode has the omniroute CLI configured):
#   1. SSH to Linode
#   2. The CLI's .env has JWT_SECRET — but that is the SECRET, not the JWT.
#      OmniRoute mints JWTs from the secret; the exact JWT to use is the one
#      the server already issued. The dashboard method (Option A) is more direct.
#
# IMPORTANT: confirm whether the Linode accepts the JWT bare or with sk- prefix.
# The local instance's api_keys table shows keys as sk-<jwt> (e.g. sk-fcf...badf).
# So the convention is: OMNIROUTE_API_KEY=sk-<JWT>. Use that unless the Linode
# returns 401 with the sk- prefix, in which case try the bare JWT.

# =============================================================================
# STEP 1: Verify OmniRoute is reachable from THIS machine
# =============================================================================
# curl the Linode's /api/cli/whoami with the JWT. If this works, the gateway is
# up and the JWT is valid.
#
# Replace <JWT> with the value you got in Step 0.
#
#   curl -s -w "\nHTTP %{http_code}\n" \
#     -H "Authorization: Bearer <JWT>" \
#     http://45.79.180.236:20128/api/cli/whoami
#
# Expect: HTTP 200 + JSON with user/instance info.
# If HTTP 401/403 → JWT is wrong or the Linode uses a different secret.
# If connection refused → OmniRoute is down on the Linode (start the container).

# =============================================================================
# STEP 2: Verify a real chat/completion works
# =============================================================================
# This is the exact request Hermes and the backend will make.
#
#   curl -s -X POST http://45.79.180.236:20128/v1/chat/completions \
#     -H "Authorization: Bearer <JWT>" \
#     -H "Content-Type: application/json" \
#     -d '{"model":"free","messages":[{"role":"user","content":"say hello in one word"}],"max_tokens":8,"temperature":0}'
#
# Expect: HTTP 200 + JSON with choices[0].message.content = "hello" (or similar).
# This proves: JWT valid, model "free" resolves, gateway routing works.

# =============================================================================
# STEP 3: Verify the backend can reach OmniRoute
# =============================================================================
# After merging the omniroute-backend-env.txt values into the backend .env,
# run the backend's test script from the digitalldefined-os-backend directory.
#
#   cd C:/Users/frank/Documents/DigitallyDefinedClean/digitallydefined-os-backend
#   node scripts/test-omniroute.js
#
# The test script reads OMNIROUTE_BASE_URL, OMNIROUTE_API_KEY, OMNIROUTE_MODEL
# from the environment and exercises omniRoute(), omniRouteStream(), fallbacks,
# error handling. All 6 tests should pass.
#
# If OMNIROUTE_BASE_URL/OMNIROUTE_API_KEY are undefined in the node process,
# the .env isn't being loaded — check that the backend's startup loads .env
# (e.g. dotenv/config, or the process is started from a shell that sources .env).

# =============================================================================
# STEP 4: Verify Hermes can reach OmniRoute
# =============================================================================
# After:
#   - merging omniroute-hermes-env.txt into Hermes .env
#   - adding the omniroute entry to Hermes config.yaml mcp_servers
#
# Test 1 — Hermes env has the values:
#   node -e "console.log(process.env.OMNIROUTE_BASE_URL, process.env.OMNIROUTE_API_KEY?.substring(0,14)+'...')"
#   Expect: http://45.79.180.236:20128  sk-<JWT prefix>...
#
# Test 2 — Hermes can call /v1/chat/completions through OmniRoute:
#   This is best done via a Hermes chat session where Hermes uses the omniroute
#   MCP server. Ask Hermes: "Call OmniRoute and say hello." Hermes should route
#   through http://45.79.180.236:20128/v1/chat/completions with the JWT.
#
# Test 3 — Fallback behavior:
#   Ask Hermes to use a model that doesn't exist (e.g. "nonexistent/model").
#   Hermes should retry with "free" and succeed. This matches the backend's
#   testFallbackModels() behavior.

# =============================================================================
# STEP 5: Confirm no new providers/models/routing were added
# =============================================================================
# On the Linode, compare the provider count and routing rules before and after:
#
#   sqlite3 ~/.omniroute/data/storage.sqlite "SELECT count(*) FROM provider_connections;"
#   sqlite3 ~/.omniroute/data/storage.sqlite "SELECT count(*) FROM combos;"
#   sqlite3 ~/.omniroute/data/storage.sqlite "SELECT count(*) FROM routing_decisions;"
#
# These counts should be UNCHANGED after Hermes starts using OmniRoute.
# Hermes adapts to OmniRoute — it does not change it.

# =============================================================================
# TROUBLESHOOTING
# =============================================================================
# Problem: curl /api/cli/whoami returns 401 Invalid management token
#   → The JWT is wrong or the Linode's JWT_SECRET differs from what you used.
#   → Get the JWT from the dashboard (Step 0, Option A) — that's the JWT the
#     server already accepted.
#
# Problem: curl returns connection refused
#   → OmniRoute is not running on the Linode, or the Linode firewall blocks 20128.
#   → SSH to Linode: docker ps -a | grep omniroute  (is it up?)
#   → If down: docker start omniroute  (or re-up with the .env)
#   → If up but refused: check ufw/iptables on the Linode — port 20128 must be
#     reachable from your IP. The Linode's OmniRoute .env has HOSTNAME=0.0.0.0,
#     so it binds to all interfaces; the firewall is the likely blocker.
#
# Problem: model "free" returns 400 unknown model
#   → The Linode's OmniRoute doesn't have "free" as a routed model alias.
#   → Check /v1/models from the Linode to see what model strings it accepts.
#   → Use a model string that IS in the catalog (e.g. a groq/ or antigravity/
#     prefixed model). But prefer "free" if OmniRoute supports it — it's the
#     backend's default and the lowest-friction option.
#
# Problem: Hermes MCP omniroute server fails to connect
#   → Hermes can't read OMNIROUTE_API_KEY from its .env (check the .env is loaded
#     in the Hermes session — Hermes may need a restart after editing .env).
#   → Check Hermes config.yaml mcp_servers.omniroute.url is http://45.79.180.236:20128
#     (NOT localhost).
