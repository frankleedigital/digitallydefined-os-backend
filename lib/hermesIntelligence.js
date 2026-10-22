// lib/hermesIntelligence.js — Hermes Intelligence Layer (Notion-backed)
import { notifyOpportunity, notifyBuildRequest } from "./slack.js";
const NOTION_VERSION = "2022-06-28";
const DB = {
  feedback: process.env.NOTION_DB_FEEDBACK,
  featureRequests: process.env.NOTION_DB_FEATURE_REQUESTS,
  productRequests: process.env.NOTION_DB_PRODUCT_REQUESTS,
  demandSignals: process.env.NOTION_DB_DEMAND_SIGNALS,
  opportunities: process.env.NOTION_DB_OPPORTUNITIES,
  buildRequests: process.env.NOTION_DB_BUILD_REQUESTS,
  insights: process.env.NOTION_DB_HERMES_INSIGHTS,
};

async function notionCreate(dbKey, properties) {
  if (!NOTION_TOKEN || !DB[dbKey]) {
    // fallback in-memory log
    console.warn(`[hermes] Notion DB ${dbKey} not configured; skipping persist`);
    return { id: `local-${Date.now()}` };
  }
  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: { Authorization: `Bearer ${NOTION_TOKEN}`, "Notion-Version": NOTION_VERSION, "Content-Type": "application/json" },
    body: JSON.stringify({ parent: { database_id: DB[dbKey] }, properties }),
  });
  if (!res.ok) throw new Error(`Notion ${res.status}: ${await res.text()}`);
  return res.json();
}

function textProp(v) { return { title: [{ text: { content: String(v || "") } }] }; }
function richProp(v) { return { rich_text: [{ text: { content: String(v || "") } }] }; }
function numProp(v) { return { number: Number(v) || 0 }; }
function selectProp(v) { return { select: { name: String(v || "") } }; }

export async function recordFeedback(entry) {
  return notionCreate("feedback", {
    User: richProp(entry.user || "anonymous"),
    Product: richProp(entry.product || ""),
    Category: selectProp(entry.category || "general"),
    Feedback: richProp(entry.feedback || ""),
    Sentiment: selectProp(entry.sentiment || "neutral"),
    "Requested Feature": richProp(entry.requestedFeature || ""),
    Timestamp: { date: { start: new Date().toISOString() } },
  });
}

export async function recordFeatureRequest(req) {
  return notionCreate("featureRequests", {
    Request: textProp(req.request),
    Frequency: numProp(req.frequency || 1),
    Product: richProp(req.product || ""),
    "Demand Score": numProp(req.demandScore || 0),
    Status: selectProp(req.status || "open"),
  });
}

export async function recordProductRequest(req) {
  return notionCreate("productRequests", {
    "Product Requested": textProp(req.product),
    Audience: richProp(req.audience || ""),
    Frequency: numProp(req.frequency || 1),
    "Revenue Potential": selectProp(req.revenuePotential || "Medium"),
    "Confidence Score": numProp(req.confidenceScore || 0),
  });
}

function scoreDemand(freq) {
  if (freq >= 30) return 90;
  if (freq >= 20) return 75;
  if (freq >= 10) return 60;
  if (freq >= 5) return 40;
  return 20;
}

export async function computeDemand(featureReqs, productReqs) {
  const results = [];
  for (const r of featureReqs || []) {
    const demandScore = scoreDemand(r.frequency);
    const opportunityScore = Math.min(100, demandScore + (r.frequency >= 10 ? 10 : 0));
    const recommendationScore = Math.round((demandScore + opportunityScore) / 2);
    await recordFeatureRequest({ ...r, demandScore, status: "scored" });
    if (opportunityScore >= 60) await createOpportunity({ name: r.request, evidence: `${r.frequency} requests`, audience: r.audience || "Gen X women", demandScore, opportunityScore, recommendationScore });
    results.push({ ...r, demandScore, opportunityScore, recommendationScore });
  }
  for (const r of productReqs || []) {
    const demandScore = scoreDemand(r.frequency);
    const opportunityScore = Math.min(100, demandScore + 15);
    const recommendationScore = Math.round((demandScore + opportunityScore) / 2);
    await recordProductRequest({ ...r, demandScore });
    if (opportunityScore >= 60) await createOpportunity({ name: r.product, evidence: `${r.frequency} requests`, audience: r.audience || "Gen X women", demandScore, opportunityScore, recommendationScore });
  }
  return results;
}

export async function createOpportunity(opp) {
  const rec = {
    ...opp,
    revenuePotential: opp.opportunityScore >= 80 ? "High" : opp.opportunityScore >= 60 ? "Medium" : "Low",
    suggestedPrice: opp.opportunityScore >= 80 ? 49 : opp.opportunityScore >= 60 ? 29 : 19,
    status: "open",
  };
  await notionCreate("opportunities", {
    Opportunity: textProp(opp.name),
    "Confidence Score": numProp(opp.opportunityScore),
    "Demand Score": numProp(opp.demandScore),
    "Estimated Revenue": richProp(rec.revenuePotential),
    "Recommended Product": richProp(opp.name),
    Status: selectProp(rec.status),
  });
  notifyOpportunity(rec).catch(() => {});
  if (opp.opportunityScore >= 80) {
    const br = await createBuildRequest({ ...rec, name: opp.name, evidence: opp.evidence, audience: opp.audience });
    notifyBuildRequest(br).catch(() => {});
  }
  return rec;
}

export async function createBuildRequest(opp) {
  return notionCreate("buildRequests", {
    "Product Concept": textProp(opp.name),
    Audience: richProp(opp.audience || ""),
    Features: richProp("Core feature set, Templates, Documentation"),
    "Required Databases": richProp("Customer Feedback, Feature Requests"),
    "Revenue Potential": richProp(opp.revenuePotential || ""),
    Evidence: richProp(opp.evidence || ""),
  });
}

export async function generateBriefing(period = "weekly") {
  return {
    period,
    generatedAt: new Date().toISOString(),
    summary: "Hermes briefing generated. Connect Notion DBs for full data.",
  };
}

