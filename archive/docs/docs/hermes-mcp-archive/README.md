# Hermes MCP Server (ARCHIVED)

**Status:** Retired — not deployed anywhere.

This is the original Python Hermes MCP server (`mcp_server.py`, `main.py`, agents,
tools). It was never hosted: the live "Hermes brain" is the Deno Edge Function at
`digitallydefined-os-backend/supabase/functions/hermes/index.ts`, deployed on
Supabase (`https://dijjlppdljpcgyoakdnq.supabase.co/functions/v1/hermes`).

If you want to revive a standalone MCP server later, deploy this folder
deliberately (container host) and wire its config in `hermes/config.yaml`.
Do not assume anything in production calls it.
