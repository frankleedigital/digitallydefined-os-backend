/**
 * api/hermes-mcp.ts
 * DigitallyDefined — Hermes MCP server (Streamable HTTP transport).
 *
 * A real MCP endpoint that Claude Desktop / Claude Code can connect to
 * (deployed at /api/hermes-mcp via Vercel's api/ routing, plus rewrites
 * for /hermes-mcp and /mcp in vercel.json).
 *
 * Implements the MCP Streamable HTTP spec:
 *   - POST  -> JSON-RPC message (initialize handshake, tools/list, tools/call…)
 *   - GET   -> server-initiated SSE stream for the session
 *   - DELETE-> end the session
 *   - OPTIONS -> CORS preflight
 * Sessions are keyed by the Mcp-Session-Id header.
 */

import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildHermesMcpServer } from "../lib/hermesMcp.js";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
];

// In-memory session store keyed by Mcp-Session-Id. On serverless this resets on
// cold start; Claude reconnects with initialize and a fresh session as needed.
const sessions = new Map();

function resolveOrigin(req) {
  const origin = req.headers?.origin || "";
  if (!origin) return "*";
  if (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith(".digitallydefined.online") ||
    origin.includes("localhost")
  ) {
    return origin;
  }
  return "https://digitallydefined.online";
}

function readSessionId(req) {
  const h = req.headers || {};
  return h["mcp-session-id"] || h["Mcp-Session-Id"] || "" ;
}

export default async function handler(req, res) {
  const method = (req.method || "GET").toUpperCase();
  const origin = resolveOrigin(req);

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization, Mcp-Session-Id, x-api-key, apikey"
  );
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

  if (method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  let sessionId = readSessionId(req);
  let session = sessionId ? sessions.get(sessionId) : undefined;

  // Brand-new session: build one McpServer + transport, attach to the store.
  if (!session) {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });
    const server = buildHermesMcpServer();
    await server.connect(transport);
    session = { server, transport };
    transport.onclose = () => {
      if (transport.sessionId) sessions.delete(transport.sessionId);
    };
  }

  try {
    await session.transport.handleRequest(req, res);
  } finally {
    // After initialize the transport owns a real session id — index by it so the
    // next request (with Mcp-Session-Id header) reuses this transport.
    const sid = session.transport.sessionId;
    if (sid && !sessions.has(sid)) sessions.set(sid, session);
  }
}
