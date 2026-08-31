/**
 * scripts/smoke-hermes-mcp.mjs
 * DigitallyDefined — end-to-end smoke test for the Hermes MCP server.
 *
 * Boots the Streamable HTTP transport on a local port, connects with the
 * official MCP client, then asserts:
 *   1. initialize handshake succeeds
 *   2. tools/list returns our tools (hermes.chat, hermes.status)
 *   3. tools/call on hermes.status returns a text payload
 *
 * It does NOT hit OmniRoute (hermes.status needs only the env check), so it
 * validates the MCP protocol layer even without a live upstream.
 *
 * Usage: npm run smoke:mcp
 */

import { randomUUID } from "node:crypto";
import http from "node:http";
import "dotenv/config";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { buildHermesMcpServer } from "../lib/hermesMcp.js";

const PORT = 8972;
const sessions = new Map();

function makeHandler(req, res) {
  const method = (req.method || "GET").toUpperCase();
  const sessionId = req.headers["mcp-session-id"] || "";
  let session = sessionId ? sessions.get(sessionId) : undefined;

  if (!session) {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });
    const server = buildHermesMcpServer();
    void server.connect(transport);
    session = { server, transport };
    transport.onclose = () => {
      if (transport.sessionId) sessions.delete(transport.sessionId);
    };
  }

  session.transport
    .handleRequest(req, res)
    .then(() => {
      const sid = session.transport.sessionId;
      if (sid && !sessions.has(sid)) sessions.set(sid, session);
    })
    .catch((err) => {
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: String(err) } }));
      } else {
        res.end();
      }
    });
}

const serverHttp = http.createServer((req, res) => makeHandler(req, res));
await new Promise((resolve) => serverHttp.listen(PORT, resolve));
const url = new URL(`http://localhost:${PORT}/`);

const client = new Client({ name: "smoke-client", version: "0.0.1" });
const transport = new StreamableHTTPClientTransport(url);
await client.connect(transport);

console.log("✓ connected, transport established");

const toolsResult = await client.listTools();
const names = toolsResult.tools.map((t) => t.name).sort();
console.log("✓ tools/list ->", names.join(", "));
if (!names.includes("hermes.chat") || !names.includes("hermes.status")) {
  throw new Error("tools/list did not return hermes.chat + hermes.status");
}

const statusResult = await client.callTool({ name: "hermes.status", arguments: {} });
const statusText = statusResult.content?.map((c) => c.text || "").join("\n") || "";
console.log("✓ tools/call hermes.status ->\n" + statusText);
if (!/hermes-mcp/.test(statusText)) {
  throw new Error("hermes.status did not return expected payload");
}

// Live OmniRoute check — only when the key is configured, so the smoke test
// still validates pure protocol when no upstream is reachable.
if (process.env.OMNIROUTE_API_KEY) {
  console.log("… calling hermes.chat through live OmniRoute …");
  const chatResult = await client.callTool({
    name: "hermes.chat",
    arguments: { prompt: "Reply with exactly: OK" },
  });
  const chatText = chatResult.content?.map((c) => c.text || "").join("\n") || "";
  console.log("✓ tools/call hermes.chat ->\n" + chatText);
  if (/ERROR:/.test(chatText)) {
    throw new Error(`hermes.chat failed: ${chatText}`);
  }
} else {
  console.log("• OMNIROUTE_API_KEY not set — skipping live hermes.chat call");
}

await client.close();
serverHttp.close();

console.log("\nSMOKE TEST PASSED ✓");