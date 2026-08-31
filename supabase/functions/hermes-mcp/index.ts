// supabase/functions/hermes-mcp/index.ts

const { TransformStream } = globalThis;

export default async function handler(requestBody: any) {
  try {
    // Claude MCP handshake
    if (requestBody?.method === "initialize") {
      return {
        jsonrpc: "2.0",
        id: requestBody.id,
        result: {
          protocolVersion: "2024-11-05",   // REQUIRED VERSION
          serverInfo: {
            name: "hermes-mcp",
            version: "1.0.0"
          },
          capabilities: {
            tools: {}
          }
        }
      };
    }

    // Claude MCP tool listing
    if (requestBody?.method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id: requestBody.id,
        result: {
          tools: []
        }
      };
    }

    // Default fallback
    return {
      jsonrpc: "2.0",
      id: requestBody?.id ?? 1,
      result: {
        message: "Hermes MCP handler is running"
      }
    };

  } catch (err) {
    console.error("Hermes MCP error:", err);
    return {
      jsonrpc: "2.0",
      id: requestBody?.id ?? 1,
      error: {
        code: -32000,
        message: "Internal MCP error"
      }
    };
  }
}
