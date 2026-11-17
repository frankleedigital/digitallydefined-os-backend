# MCP_AUDIT_REPORT.md

## MCPs configured
1. OmniRoute (SSE) — endpoint http://localhost:20128/v1/mcp/sse — purpose AI gateway — auth bearer via OMNIROUTE_API_KEY — tools: models.list, chat.completions.create — defined in omniroute-hermes-mcp-config.yaml.

## Notion
- No MCP (gateway-notion/notion-mcp/notion server) found. Notion accessed via direct REST API (api.notion.com/v1) using NOTION_API_KEY.
- Antigravity MCP client (lib/antigravity.js) targets https://mcp.notion.com with Notion REST fallback.

## Authentication
- OmniRoute: bearer token (OMNIROUTE_API_KEY).
- Notion: bearer token (NOTION_API_KEY).

## Active/inactive
- OmniRoute: active only when Docker running on localhost:20128.
- Notion REST: active (token present).

## Tools exposed
- OmniRoute: models.list, chat.completions.create.
- Notion: page CRUD, DB queries via REST (no MCP tool surface).
