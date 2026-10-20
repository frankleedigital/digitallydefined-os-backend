import os, json, re
from collections import defaultdict

CLEAN = r"C:\Users\frank\Documents\DigitallyDefinedClean"
PROJ = {
    "dashboard": os.path.join(CLEAN, "digitallydefined-dashboard"),
    "os-backend": os.path.join(CLEAN, "digitallydefined-os-backend"),
    "digital-products": os.path.join(CLEAN, "digital-products"),
    "os-workers": os.path.join(CLEAN, "digitallydefined-os-workers"),
}

SKIP = {"node_modules", ".git", "dist", "build", ".next", ".venv", "venv",
        "__pycache__", ".cache", ".turbo", "coverage", ".output", ".vercel",
        ".hermes", "output", "archive", "workspace"}
CODE_EXT = {".js", ".jsx", ".ts", ".tsx", ".py", ".mjs", ".cjs", ".css", ".html"}

def walk_code(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP]
        for fn in filenames:
            ext = os.path.splitext(fn)[1].lower()
            if ext not in CODE_EXT:
                continue
            p = os.path.join(dirpath, fn)
            try:
                if os.path.getsize(p) > 2_000_000:
                    continue
                with open(p, "r", encoding="utf-8", errors="ignore") as f:
                    yield os.path.relpath(p, root).replace("\\", "/"), f.read()
            except Exception:
                pass

# ---- HARDCODED ----
HC = [
    ("supabase-url", r"https://[a-z0-9]{10,30}\.supabase\.co"),
    ("notion-db-uuid", r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b"),
    ("jwt-like-key", r"eyJ[A-Za-z0-9_\-]{40,}"),
    ("ntn-key", r"ntn_[A-Za-z0-9]{20,}"),
    ("sk-key", r"sk-[A-Za-z0-9]{20,}"),
    ("localhost", r"localhost:\d{2,5}"),
    ("vercel-url", r"https://[a-z0-9\-]+\.vercel\.app"),
    ("gumroad-url", r"https://[a-z0-9\-]+\.gumroad\.com"),
    ("api-key-header", r"DigitallyDefined-OS-2026"),
]
hardcoded = {}
for name, root in PROJ.items():
    agg = defaultdict(list)
    for rel, content in walk_code(root):
        for label, pat in HC:
            m = re.findall(pat, content)
            if m:
                agg[label].append({"file": rel, "count": len(m), "samples": sorted(set(m))[:2]})
    hardcoded[name] = dict(agg)

# ---- ENDPOINTS ----
endpoints = {}
for name, root in PROJ.items():
    eps = defaultdict(list)
    for rel, content in walk_code(root):
        for m in re.findall(r"action\s*===?\s*['\"]([a-zA-Z0-9_.\-]+)['\"]", content):
            eps["edge-action"].append({"file": rel, "value": m})
        for m in re.findall(r"\.(get|post|put|delete|patch)\s*\(\s*['\"]([^'\"]+)['\"]", content):
            eps["http-route"].append({"file": rel, "method": m[0].upper(), "path": m[1]})
        for m in re.findall(r"fetch\s*\(\s*[`'\"]?([^`'\")\s]+)", content):
            if m.startswith("http") or m.startswith("/"):
                eps["fetch"].append({"file": rel, "url": m})
    endpoints[name] = {k: v for k, v in eps.items()}

# ---- DUP LOGIC SIGNALS ----
dup_signals = {}
for name, root in PROJ.items():
    sig = defaultdict(list)
    for rel, content in walk_code(root):
        low = content.lower()
        for label, needles in {
            "notion-api-direct": ["api.notion.com/v1"],
            "supabase-rest-direct": ["/rest/v1/"],
            "omniroute-direct": ["45.79.180.236", "omniroute"],
            "brevo-direct": ["brevo", "api.brevo.com"],
            "sendgrid-direct": ["sendgrid", "api.sendgrid.com"],
            "gumroad-direct": ["gumroad"],
            "openrouter-direct": ["openrouter.ai"],
            "make-direct": ["make.com", "makeintegromat"],
            "zapier-direct": ["zapier"],
            "linear-direct": ["linear.app", "api.linear"],
            "notion-db-ids": ["notion_leads_db_id", "notion_ideas_db_id", "notion_content_db_id"],
            "supabase-keys": ["supabase_service_role_key", "supabase_anon_key"],
            "localStorage": ["localStorage"],
            "hardcoded-prices": ["$27", "$47", "$97", "$197", "$297", "$997"],
        }.items():
            for n in needles:
                if n in low:
                    sig[label].append(rel)
                    break
    dup_signals[name] = {k: sorted(set(v)) for k, v in sig.items()}

# ---- FILE SIZE DISTRIBUTION ----
sizes = {}
for name, root in PROJ.items():
    buckets = {"0-100": 0, "100-300": 0, "300-600": 0, "600-1000": 0, "1000-2000": 0, "2000+": 0}
    big = []
    for rel, content in walk_code(root):
        loc = len(content.splitlines())
        if loc < 100: buckets["0-100"] += 1
        elif loc < 300: buckets["100-300"] += 1
        elif loc < 600: buckets["300-600"] += 1
        elif loc < 1000: buckets["600-1000"] += 1
        elif loc < 2000: buckets["1000-2000"] += 1
        else:
            buckets["2000+"] += 1
            big.append({"file": rel, "loc": loc})
    big.sort(key=lambda x: -x["loc"])
    sizes[name] = {"buckets": buckets, "over_2000": big}

out = {"hardcoded": hardcoded, "endpoints": endpoints, "dup_signals": dup_signals, "sizes": sizes}
with open(os.path.join(CLEAN, "audit_signals.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)

print("=== HARDCODED VALUES ===")
for name, data in hardcoded.items():
    print(f"\n## {name}")
    for label, hits in data.items():
        total = sum(h["count"] for h in hits)
        print(f"  {label}: {total} occurrences in {len(hits)} files")
        for h in hits[:4]:
            print(f"     {h['file']} ({h['count']}) {h['samples']}")

print("\n=== ENDPOINT SURFACE ===")
for name, data in endpoints.items():
    print(f"\n## {name}")
    for label, hits in data.items():
        vals = sorted(set(h.get("value") or h.get("path") or h.get("url") for h in hits))
        print(f"  {label}: {len(hits)} refs, {len(vals)} unique")
        for v in vals[:15]:
            print(f"     {v}")

print("\n=== DUPLICATED LOGIC SIGNALS ===")
for name, data in dup_signals.items():
    print(f"\n## {name}")
    for label, files in data.items():
        print(f"  {label}: {len(files)} files -> {files[:6]}")

print("\n=== FILE SIZE DISTRIBUTION ===")
for name, data in sizes.items():
    print(f"\n## {name}")
    print(f"  buckets: {data['buckets']}")
    for b in data["over_2000"]:
        print(f"  OVER 2000 LOC: {b['loc']} {b['file']}")
