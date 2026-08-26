# DigitallyDefined — OmniRoute API key + WebSocket Bridge instructions for Hermes
#
# Operational guidance Hermes follows when making LLM calls through the Linode's
# OmniRoute. Mirrors the backend's lib/omniroute.js behavior exactly.
# =============================================================================

# =============================================================================
# 1. OmniRoute API key usage
# =============================================================================
# EVERY LLM request goes through OmniRoute. No direct provider calls.
#
# Base URL:  http://45.79.180.236:20128
# Endpoint:  /v1/chat/completions
# Auth:      Authorization: Bearer ${OMNIROUTE_API_KEY}
# Model:     "free" (default) — OmniRoute resolves to a real provider/model
#
# The API key is the JWT Bearer token from the Linode's OmniRoute.
# SOURCE: Linode ~/.omniroute/.env → the JWT the dashboard/CLI already uses.
#
# To get it once:
#   1. SSH to the Linode
#   2. Open the dashboard at https://<your-domain>/dashboard in a browser
#   3. The Bearer token in the dashboard's outgoing /v1/ requests IS the JWT
#      (check any chat/completions request in the browser's network tab)
#   4. OR: if the omniroute CLI is configured on the Linode, the JWT is what
#      the CLI sends — but the CLI env get JWT_SECRET only returns the SECRET,
#      not the JWT itself. The JWT is minted from the secret by OmniRoute.
#   5. Paste the full JWT into OMNIROUTE_API_KEY (prefixed sk- per the backend's
#      convention — the backend stores keys as sk-<jwt> in its api_keys table).
#
# Hermes uses the "hermes" key only (machine_id fcfcf4cfe8fd70e5 in the local
# instance; replace with the Linode's hermes-key machine_id if different).
# Do NOT use the DigitallyDefined, Supabase, or hermes-local keys for Hermes.
#
# Request shape (matches lib/omniroute.js EXACTLY):
#   POST /v1/chat/completions
#   {
#     "model": "free",
#     "messages": [
#       { "role": "system", "content": "<system prompt>" },
#       { "role": "user",  "content": "<prompt>" }
#     ],
#     "stream": false
#   }
#
# Error handling (matches lib/omniroute.js):
#   401/403 → key or auth problem; stop and report; do NOT retry with a different key
#   429     → rate limited; retry once after short backoff, then fall back to "free"
#   5xx     → provider-side error; OmniRoute's own fallback chain handles it
#   timeout → abort after 60s, report, do NOT spin on the same model
#
# Forbidden:
#   - Hardcode a model not in OmniRoute's catalog
#   - Call Groq/Antigravity/Nous/etc. directly (bypass OmniRoute)
#   - Use a key not bound to the machine ID above
#   - Log the JWT or API key in plaintext

# =============================================================================
# 2. WebSocket Bridge — for streaming / long-lived agent connections (optional)
# =============================================================================
# The Linode's OmniRoute may expose a WebSocket bridge for Codex Responses
# streaming and agent ops. Hermes uses it ONLY when a workflow needs streaming
# or a long-lived connection. For standard chat/completions, HTTP is enough.
#
# WS endpoint:   ws://45.79.180.236:20128
# Auth:          same Bearer JWT as the HTTP API (OMNIROUTE_API_KEY)
# Bridge secret: OMNIROUTE_WS_BRIDGE_SECRET (from Linode .env, if set)
#
# If the WS bridge requires the bridge secret as a header or subprotocol:
#   - Header form:  X-WS-Bridge-Secret: <OMNIROUTE_WS_BRIDGE_SECRET>
#   - Subprotocol:  per OmniRoute's WS bridge spec (check the Linode dashboard
#                    or the WS connection handshake to see what it expects)
#
# To get the bridge secret once:
#   1. SSH to the Linode
#   2. cat ~/.omniroute/.env  → read OMNIROUTE_WS_BRIDGE_SECRET=<value>
#   3. If it is empty/placeholder, the WS bridge is not configured on the Linode
#      yet — Hermes uses HTTP streaming (stream:true on /v1/chat/completions)
#      until it is.
#
# Hermes WS usage:
#   - Use WS only when a workflow needs real-time streaming or a long-lived agent
#   - For normal chat, use HTTP /v1/chat/completions with stream:true
#   - Do NOT expose the WS bridge secret to the browser/frontend

# =============================================================================
# 3. Machine ID binding
# =============================================================================
# All OmniRoute API keys are bound to a machine_id. Hermes's "hermes" key is
# bound to machine_id fcfcf4cfe8fd70e5 (from the local instance's api_keys table).
#
# If the Linode's hermes key has a different machine_id, use that instead:
#   SSH to Linode → sqlite3 ~/.omniroute/data/storage.sqlite
#     "SELECT id, name, key_prefix, machine_id FROM api_keys WHERE name='hermes';"
#
# Hermes must send the machine_id with requests if OmniRoute's auth model requires
# it. The backend's lib/omniroute.js does not currently send machine_id explicitly
# (it relies on the JWT being bound to the machine), so Hermes follows the same
# pattern: the JWT IS the machine-bound credential.
