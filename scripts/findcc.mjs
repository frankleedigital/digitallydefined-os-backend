import { config } from "dotenv";
config();
const t = process.env.NOTION_API_KEY;
const res = await fetch("https://api.notion.com/v1/search", { method: "POST", headers: { Authorization: "Bearer " + t, "Notion-Version": "2022-06-28", "Content-Type": "application/json" }, body: JSON.stringify({ query: "Command Center", page_size: 10 }) });
const data = await res.json();
for (const p of data.results || []) console.log(p.id, (p.title?.[0]?.plain_text) || (p.properties?.title?.title?.[0]?.plain_text) || "");
