// scripts/provision-hermes-dbs.mjs
import { config } from "dotenv";
config();
const token = process.env.NOTION_API_KEY;
const parent = process.env.NOTION_PARENT_PAGE_ID;
if (!parent) { console.error("Set NOTION_PARENT_PAGE_ID"); process.exit(1); }

const schemas = {
  "Customer Feedback": { User: "rich_text", Product: "rich_text", Category: "select", Feedback: "rich_text", Sentiment: "select", "Requested Feature": "rich_text", Timestamp: "date" },
  "Feature Requests": { Request: "title", Frequency: "number", Product: "rich_text", "Demand Score": "number", Status: "select" },
  "Product Requests": { "Product Requested": "title", Audience: "rich_text", Frequency: "number", "Revenue Potential": "select", "Confidence Score": "number" },
  "Demand Signals": { "Signal Type": "title", Source: "rich_text", Count: "number", Trend: "select", "Revenue Opportunity": "rich_text" },
  "Opportunities": { Opportunity: "title", "Confidence Score": "number", "Demand Score": "number", "Estimated Revenue": "rich_text", "Recommended Product": "rich_text", Status: "select" },
  "Hermes Insights": { Insight: "title", "Source Data": "rich_text", Confidence: "number", "Recommended Action": "rich_text", "Created Date": "date" },
  "Build Requests": { "Product Concept": "title", Audience: "rich_text", Features: "rich_text", "Required Databases": "rich_text", "Revenue Potential": "rich_text", Evidence: "rich_text" },
};

function propDef(type) {
  if (type === "title") return { title: {} };
  if (type === "rich_text") return { rich_text: {} };
  if (type === "number") return { number: { format: "number" } };
  if (type === "select") return { select: { options: [{ name: "open" }, { name: "closed" }, { name: "high" }, { name: "medium" }, { name: "low" }, { name: "neutral" }, { name: "positive" }, { name: "negative" }, { name: "up" }, { name: "down" }, { name: "stable" }] } };
  if (type === "date") return { date: {} };
  return {};
}

for (const [name, schema] of Object.entries(schemas)) {
  const properties = {};
  for (const [k, t] of Object.entries(schema)) properties[k] = propDef(t);
  const res = await fetch("https://api.notion.com/v1/databases", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
    body: JSON.stringify({ parent: { type: "page_id", page_id: parent }, title: [{ type: "text", text: { content: name } }], properties }),
  });
  const data = await res.json();
  console.log(name, "->", data.id || data.message);
}
EOF