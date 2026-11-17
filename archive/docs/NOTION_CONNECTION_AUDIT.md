# NOTION_CONNECTION_AUDIT.md

## 1. Does Antigravity use a Notion MCP server?
No. Antigravity uses direct Notion REST API (api.notion.com/v1) via native fetch. No @modelcontextprotocol Notion server. (hermesMcp.js uses @modelcontextprotocol SDK but exposes Hermes tools, not Notion.)

## 2. Does Antigravity talk directly to the Notion API?
Yes. lib/antigravity.js calls fetch to NOTION_API_BASE (https://api.notion.com/v1) with Authorization: Bearer <notionToken>.

## 3. Which files implement Notion access?
lib/antigravity.js, lib/notion-client.js, lib/notion-write.js, lib/notion-schema.js, lib/sync-aggregator.js, lib/hermesIntelligence.js, src/routes/_original-index-backup.js, src/config/env.js.

## 4. Environment variables required
NOTION_API_KEY (primary), NOTION_TOKEN, NOTION_SECRET, ANTIGRAVITY_NOTION_TOKEN, plus per-DB IDs (NOTION_*_DB_ID).

## 5. Is there already a configured Notion connection?
Yes. NOTION_API_KEY present in .env. Direct REST API connection verified (search + DB property audit succeeded).
