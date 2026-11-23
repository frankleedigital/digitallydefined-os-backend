import { config } from "dotenv";
config();
const t = process.env.NOTION_API_KEY;
const listRes = await fetch("https://api.notion.com/v1/search", { method: "POST", headers: { Authorization: "Bearer " + t, "Notion-Version": "2022-06-28", "Content-Type": "application/json" }, body: JSON.stringify({ filter: { value: "database", property: "object" }, page_size: 100 }) });
const list = await listRes.json();
const targets = ["Portfolio Role","Cash Now","Growth Engine","Authority","Retirement Builder","Launch Date","Revenue Goal","Asset Stage","Build Status","Priority","Content Pillar","Confidence Score","Comfort Score","Money Urgency","No-Go Zones","Suggested Assets","Digital Independence Score"];
for (const db of list.results || []) {
  const r = await fetch("https://api.notion.com/v1/databases/" + db.id, { headers: { Authorization: "Bearer " + t, "Notion-Version": "2022-06-28" } });
  const d = await r.json();
  const props = Object.keys(d.properties || {});
  const hits = targets.filter((x) => props.includes(x));
  if (hits.length) console.log(db.id, d.title?.[0]?.plain_text, "=>", hits.join(", "));
}
console.log("DONE");
