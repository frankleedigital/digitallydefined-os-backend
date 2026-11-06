// supabase/functions/product-factory/index.ts
// Product Factory — orchestrates the full digital product pipeline.
//
// Triggered by:
//   - Manual "Build Product" button in dashboard (POST /api?action=product.factory)
//   - Notion webhook when BuildNow = true (Phase 2)
//   - Gumroad webhook when product is sold (Phase 3)
//
// Pipeline:
//   1. Read idea from Notion Ideas DB
//   2. AI generates product metadata (title, description, price, niche)
//   3. Create Digital Asset record in Notion
//   4. Generate sales page content (websiteEditor)
//   5. Generate email sequence (email-publish)
//   6. Generate social posts (social-publishers)
//   7. Queue for approval (Status = "Pending Approval")
//   8. On approval → publish to Gumroad + website
//   9. Track revenue in Money Snapshot DB

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

async function notionPatch(path: string, body: unknown) {
  const res = await fetch(`${NOTION_API_BASE}${path}`, {
    method: "PATCH",
    headers: notionHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

// Step 1: Read idea from Notion Ideas DB and extract clean fields
async function readIdea(ideaId: string) {
  const page = await notionGet(`/pages/${ideaId}`);
  const props = page?.properties || {};
  const get = (key: string, type: string) => {
    const p = props[key];
    if (!p) return '';
    if (type === 'title') return p.title?.[0]?.plain_text || '';
    if (type === 'rich_text') return p.rich_text?.[0]?.plain_text || '';
    if (type === 'select') return p.select?.name || '';
    if (type === 'number') return String(p.number ?? '');
    if (type === 'multi_select') return (p.multi_select || []).map((x: {name:string}) => x.name).join(', ');
    if (type === 'checkbox') return p.checkbox ? 'true' : 'false';
    if (type === 'formula') return p.formula?.string || p.formula?.number || '';
    return '';
  };

  return {
    raw: page,
    clean: {
      ideaName: get('IdeaName', 'title'),
      problemSolved: get('ProblemSolved', 'rich_text'),
      niche: get('Niche', 'rich_text'),
      audience: get('Audience', 'multi_select'),
      monetizationType: get('MonetizationType', 'multi_select'),
      pricePotential: get('PricePotential', 'number'),
      speedToLaunch: get('SpeedToLaunch', 'number'),
      evergreenPotential: get('EvergreenPotential', 'number'),
      intakeBackground: get('IntakeBackground', 'rich_text'),
      intakeSkills: get('IntakeSkills', 'rich_text'),
      intakeSuggestedAsset1: get('IntakeSuggestedAsset1', 'rich_text'),
      intakeSuggestedAsset2: get('IntakeSuggestedAsset2', 'rich_text'),
      intakeSuggestedAsset3: get('IntakeSuggestedAsset3', 'rich_text'),
      source: get('Source', 'rich_text'),
      status: get('Status', 'select'),
      ideaType: get('IdeaType', 'select'),
      readyForAI: get('ReadyForAI', 'checkbox'),
      buildNow: get('BuildNow', 'formula'),
    },
  };
}

// Step 2: AI generates product metadata
async function generateProductMetadata(ideaData: { clean: Record<string, string> }) {
  const apiKey = Deno.env.get("OMNIROUTE_API_KEY") || Deno.env.get("GEMINI_API_KEY") || "";
  const baseUrl = Deno.env.get("OMNIROUTE_BASE_URL") || "https://generativelanguage.googleapis.com/v1beta/openai";
  const model = Deno.env.get("OMNIROUTE_MODEL") || "gemini-3.5-flash";

  const c = ideaData.clean;

  // Build idea text from available fields
  const fields = [
    ["IdeaName", c.ideaName || "New Product Idea"],
    ["Problem Solved", c.problemSolved || c.transformation || "Solve a common problem"],
    ["Niche", c.niche || c.audience || "General audience"],
    ["Audience", c.audience || "Gen X women"],
    ["Monetization Type", c.monetizationType || "Digital product"],
    ["Price Potential", c.pricePotential || 27],
    ["Speed to Launch", c.speedToLaunch || 1],
    ["Suggested Assets", [c.intakeSuggestedAsset1, c.intakeSuggestedAsset2, c.intakeSuggestedAsset3].filter(Boolean).join(", ") || "PDF workbook"],
    ["Background", c.intakeBackground || "Digital product business"],
    ["Skills", c.intakeSkills || "AI marketing"],
  ];

  const ideaText = fields.map(([k, v]) => `${k}: ${v}`).join("\n");

  const prompt = `You are a digital product strategist for DigitallyDefined — a faceless digital asset business targeting Gen X women.

Analyze this idea and generate product metadata:
${ideaText}

Return ONLY a JSON object with these fields:
{
  "title": "Product title (max 60 chars)",
  "description": "Product description (max 200 chars)",
  "price": 27,
  "niche": "Target niche",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "format": "PDF|Notion|Spreadsheet|Checklist|Playbook",
  "leadMagnetTitle": "Free lead magnet title",
  "emailSubject": "Welcome email subject line"
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
          { role: "system", content: "You are a digital product strategist. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content.replace(/```json|```/g, "").trim());

    // Validate and fill defaults
    return {
      title: parsed.title || "New Digital Product",
      description: parsed.description || "A useful digital product for Gen X women.",
      price: Number(parsed.price) || 27,
      niche: parsed.niche || "General",
      keywords: Array.isArray(parsed.keywords) && parsed.keywords.length ? parsed.keywords : ["productivity", "wealth", "retirement"],
      format: parsed.format || "PDF",
      leadMagnetTitle: parsed.leadMagnetTitle || "Free Guide",
      emailSubject: parsed.emailSubject || "Welcome!",
    };
  } catch (e) {
    console.error("[product-factory] AI generation failed, using fallback:", e.message);
    // Deterministic fallback
    const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const name = c.ideaName || "New Product";
    return {
      title: name,
      description: `A digital product to help ${name}`,
      price: Number(c.pricePotential) || 27,
      niche: c.niche || "General",
      keywords: [slugify(name), "productivity", "wealth"],
      format: "PDF",
      leadMagnetTitle: `Free Guide to ${name}`,
      emailSubject: `Welcome! Here's your ${name}`,
    };
  }
}

async function createGumroadProduct(metadata: Record<string, unknown>) {
  const apiKey = Deno.env.get("GUMROAD_API_KEY");
  if (!apiKey) return null;

  const title = String(metadata.title || "New Digital Product");
  const description = String(metadata.description || "");
  const price = Number(metadata.price) || 27;

  const params = new URLSearchParams();
  params.append("access_token", apiKey);
  params.append("name", title);
  params.append("description", description);
  params.append("price", String(Math.round(price * 100)));
  params.append("currency", "usd");
  params.append("published", "false");

  try {
    const res = await fetch("https://api.gumroad.com/v2/products", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json();
    if (data?.success) {
      return {
        id: data.product?.id || null,
        url: data.product?.short_url || `https://gumroad.com/l/${data.product?.id}`,
        permalink: data.product?.permalink || null,
      };
    }
    console.error("[product-factory] Gumroad product creation failed:", JSON.stringify(data));
    return null;
  } catch (e) {
    console.error("[product-factory] Gumroad error:", e.message);
    return null;
  }
}
// Step 3: Create Digital Asset record in Notion
async function createDigitalAsset(metadata: Record<string, unknown>) {
  const dbId = Deno.env.get("NOTION_DIGITAL_ASSETS_DB_ID") || Deno.env.get("NOTION_ASSETS_DB_ID");
  if (!dbId) return null;

  const page = await notionPost("/pages", {
    parent: { database_id: dbId },
    properties: {
      Name: { title: [{ text: { content: metadata.title } }] },
      Status: { select: { name: "Draft" } },
      Niche: { rich_text: [{ text: { content: metadata.niche } }] },
      AssetValue: { number: metadata.price },
    },
  });

  return page;
}

// Step 4: Generate sales page content
async function generateSalesPage(metadata: Record<string, unknown>) {
  const title = String(metadata.title || "New Digital Product");
  const description = String(metadata.description || "A useful digital product.");
  const price = Number(metadata.price) || 27;

  return {
    headline: `Get ${title} for $${price}`,
    subheadline: description,
    price,
    cta: `Get ${title} for $${price}`,
    generated: true,
  };
}

// Step 5: Generate email sequence
async function generateEmailSequence(metadata: Record<string, unknown>) {
  const title = String(metadata.title || "New Digital Product");
  const leadMagnet = String(metadata.leadMagnetTitle || `Free Guide`);
  const subject = String(metadata.emailSubject || "Welcome!");

  return {
    subject,
    emails: [
      { day: 0, subject, body: `Welcome! Here's your ${leadMagnet}.` },
      { day: 1, subject: `How to use ${title}`, body: `Here's how ${title} helps you.` },
      { day: 3, subject: `Quick win with ${title}`, body: "Try this quick win today." },
      { day: 7, subject: `Your ${title} results`, body: "Here's what you can achieve." },
      { day: 14, subject: "Next steps", body: "Ready for the next level?" },
    ],
    generated: true,
  };
}

// Step 6: Generate social posts
async function generateSocialPosts(metadata: Record<string, unknown>) {
  const title = String(metadata.title || "New Digital Product");
  const description = String(metadata.description || "A useful digital product.");
  const niche = String(metadata.niche || "General");
  const price = Number(metadata.price) || 27;
  const keyword = (metadata.keywords && Array.isArray(metadata.keywords) && metadata.keywords[0]) || "productivity";
  const format = String(metadata.format || "PDF");

  const posts = [
    `New product: ${title} — ${description}`,
    `Just launched: ${title} for ${niche}. Only $${price}.`,
    `${title} is here! Get it now: [link]`,
    `Struggling with ${niche}? ${title} has the answer.`,
    `5 ways ${title} saves you time and money.`,
  ];
  return { posts, count: posts.length, generated: true };
}

// Step 7: Queue for approval
async function queueForApproval(assetId: string, metadata: Record<string, unknown>) {
  if (!assetId) return;
  await notionPatch(`/pages/${assetId}`, {
    properties: {
      Status: { select: { name: "Draft" } },
    },
  });
}

// Main handler
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action || "build";
    const ideaId = body.ideaId || body.id;

    if (action === "status") {
      return new Response(JSON.stringify({ ok: true, service: "product-factory", version: "1.0" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ideaId) {
      return new Response(JSON.stringify({ ok: false, error: "ideaId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Read idea
    const idea = await readIdea(ideaId);

    // Step 2: AI generates product metadata
    const metadata = await generateProductMetadata(idea as { clean: Record<string, string> });

    // Step 3: Create Digital Asset record
    const asset = await createDigitalAsset(metadata);
    const assetId = asset?.id || null;

    // Step 3b: Create Gumroad product listing
    const gumroadProduct = await createGumroadProduct(metadata);
    const gumroadId = gumroadProduct?.id || null;
    const gumroadUrl = gumroadProduct?.url || null;

    // Step 4: Generate sales page
    const salesPage = await generateSalesPage(metadata);

    // Step 5: Generate email sequence
    const emailSequence = await generateEmailSequence(metadata);

    // Step 6: Generate social posts
    const socialPosts = await generateSocialPosts(metadata);

    // Step 7: Queue for approval
    await queueForApproval(assetId, metadata);

    // Step 8: Log to Automations DB
    const automationsDbId = Deno.env.get("NOTION_AUTOMATIONS_DB_ID");
    if (automationsDbId) {
      await notionPost("/pages", {
        parent: { database_id: automationsDbId },
        properties: {
          Name: { title: [{ text: { content: `Product Factory: ${metadata.title}` } }] },
          Status: { select: { name: "Done" } },
          Source: { rich_text: [{ text: { content: "product-factory" } }] },
        },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      ideaId,
      assetId,
      gumroadId,
      gumroadUrl,
      metadata,
      salesPage,
      emailSequence,
      socialPosts,
      status: "queued_for_approval",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[product-factory] Error:", error);
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
