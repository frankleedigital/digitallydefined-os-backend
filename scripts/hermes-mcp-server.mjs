/**
 * scripts/hermes-mcp-server.mjs
 * DigitallyDefined — local Hermes MCP server (Streamable HTTP) for running
 * outside Vercel, so Claude Desktop / Claude Code can connect to a stable,
 * long-lived HTTP endpoint.
 *
 * Usage:
 *   npm run dev:mcp
 *
 * Then point Claude at:
 *   http://localhost:8971/hermes-mcp
 *
 * It reuses the exact same McpServer + transport wiring as the Vercel function
 * (api/hermes-mcp.ts). Env like OMNIROUTE_API_KEY is loaded from ./.env.
 */

import { randomUUID } from "node:crypto";
import http from "node:http";
import "dotenv/config";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildHermesMcpServer } from "../lib/hermesMcp.js";

const PORT = Number(process.env.HERMES_MCP_PORT || 8971);

const sessions = new Map();

const server = http.createServer(async (req, res) => {
  const method = (req.method || "GET").toUpperCase();
  const url = (req.url || "/").split("?")[0];

  // Simple keep-alive probe for tooling / uptime checks.
  if (method === "GET" && (url === "/" || url === "/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, name: "hermes-mcp", version: "1.0.0" }));
    return;
  }

  // Only serve the MCP endpoint at /hermes-mcp and /mcp.
  if (url !== "/hermes-mcp" && url !== "/mcp" && url !== "/api/hermes-mcp") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  const sessionId = req.headers["mcp-session-id"] || "";
  let session = sessionId ? sessions.get(sessionId) : undefined;

  if (!session) {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });
    const serverMcp = buildHermesMcpServer();
    await serverMcp.connect(transport);
    session = { server: serverMcp, transport };
    transport.onclose = () => {
      if (transport.sessionId) sessions.delete(transport.sessionId);
    };
  }

  try {
    await session.transport.handleRequest(req, res);
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: String(err?.message || err) } }));
    } else {
      res.end();
    }
  } finally {
    const sid = session.transport.sessionId;
    if (sid && !sessions.has(sid)) sessions.set(sid, session);
  }
});

server.listen(PORT, () => {
  console.log(`[hermes-mcp] listening on http://localhost:${PORT}/hermes-mcp`);
  console.log("[hermes-mcp] Open in Claude at  →  Streamable HTTP (SDK) url");
  console.log(
    `[hermes-mcp] omniroute.base_url = ${process.env.OMNIROUTE_BASE_URL || "(default)"}`
  );
  console.log(
    `[hermes-mcp] omniroute.api_key  = ${process.env.OMNIROUTE_API_KEY ? "SET" : "UNSET (check .env)"}`
  );
});