// supabase/functions/product-intelligence/index.ts
// AI Product Intelligence — analyzes product sales data and generates insights.
// Triggered by gumroad-webhook after a sale. Also callable manually.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors-utils.ts";

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

function notionHeaders() {
  const token = Deno.env.get("NOTION_API_KEY") || Deno.env.get("NOTION_SECRET") || "";
  return {
    "Authorization": `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

async function notionGet(path: string) {
  const res = await fetch(`${NOTION_API_BASE}${path}`, { headers: notionHeaders() });
  return res.json();
}

async function notionPost(path: string, body: unknown) {
  const res = await fetch(`${NOTION_API_BASE}${path}`, {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

async function generateInsights(productName: string, revenue: number, buyerEmail: string) {
  const apiKey = Deno.env.get("OMNIROUTE_API_KEY") || Deno.env.get("GEMINI_API_KEY") || "";
  const baseUrl = Deno.env.get("OMNIROUTE_BASE_URL") || "https://generativelanguage.googleapis.com/v1beta/openai";
  const model = Deno.env.get("OMNIROUTE_MODEL") || "gemini-3.5-flash";

  const prompt = `You are a revenue analyst for DigitallyDefined. Analyze this sale and provide brief insights.

Product: ${productName}
Revenue: $${revenue}
Buyer: ${buyerEmail}

Return ONLY a JSON object:
{
  "insight": "One sentence insight about this sale",
  "recommendation": "One actionable recommendation",
  "trend": "up|down|stable"
}`;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a revenue analyst. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 300,
      }),
    });

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "{}";
    return JSON.parse(content.replace(/```json|```/g, "").trim());
  } catch {
    return {
      insight: `${productName} generated $${revenue} in revenue.`,
      recommendation: "Continue promoting this product.",
      trend: "stable",
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action || "analyze";

    if (action === "status") {
      return new Response(JSON.stringify({ ok: true, service: "product-intelligence", version: "1.0" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productName = body.productName || "Unknown Product";
    const revenue = Number(body.revenue) || 0;
    const buyerEmail = body.buyerEmail || "";
    const saleId = body.saleId || "";

    // Generate AI insights
    const insights = await generateInsights(productName, revenue, buyerEmail);

    // Log insights to Automations DB
    const automationsDbId = Deno.env.get("NOTION_AUTOMATIONS_DB_ID");
    if (automationsDbId) {
      await notionPost("/pages", {
        parent: { database_id: automationsDbId },
        properties: {
          Name: { title: [{ text: { content: `AI Insight: ${productName}` } }] },
          Status: { select: { name: "Done" } },
          Source: { rich_text: [{ text: { content: "product-intelligence" } }] },
        },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      productName,
      revenue,
      insights,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[product-intelligence] Error:", error);
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
EOF