import os, json, re
from collections import defaultdict

CLEAN = r"C:\Users\frank\Documents\DigitallyDefinedClean"
PROJ = {
    "dashboard": os.path.join(CLEAN, "digitallydefined-dashboard"),
    "os-backend": os.path.join(CLEAN, "digitallydefined-os-backend"),
    "digital-products": os.path.join(CLEAN, "digital-products"),
    "os-workers": os.path.join(CLEAN, "digitallydefined-os-workers"),
    "backend-clean": os.path.join(CLEAN, "digitallydefined-backend-clean"),
}

SKIP = {"node_modules", ".git", "dist", "build", ".next", ".venv", "venv",
        "__pycache__", ".cache", ".turbo", "coverage", ".output", ".vercel",
        ".hermes", "output", "archive", "workspace", "scripts"}

CODE_EXT = {".js", ".jsx", ".ts", ".tsx", ".py", ".mjs", ".cjs", ".css", ".html"}

# ---------- 1. DUPLICATE CONTENT DETECTION ----------
def content_hashes(root):
    """Map sha1(content) -> [paths] for code files, excluding obvious generated."""
    hashes = defaultdict(list)
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP]
        for fn in filenames:
            ext = os.path.splitext(fn)[1].lower()
            if ext not in CODE_EXT:
                continue
            p = os.path.join(dirpath, fn)
            try:
                if os.path.getsize(p) > 1_000_000:
                    continue
                with open(p, "rb") as f:
                    raw = f.read()
                if len(raw) < 200:  # too small to matter
                    continue
                import hashlib
                h = hashlib.sha1(raw).hexdigest()
                hashes[h].append(os.path.relpath(p, root).replace("\\", "/"))
            except Exception:
                pass
    return {h: v for h, v in hashes.items() if len(v) > 1}

# ---------- 2. DUPLICATE LOGIC / NAME PATTERNS ----------
DUP_PATTERNS = [
    ("sync-aggregator", r"sync-aggregator"),
    ("notion-architect", r"notion-architect"),
    ("omniroute", r"omniroute"),
    ("hermes", r"hermes"),
    ("brevo-email", r"brevo-email"),
    ("notion-client", r"notion-client"),
    ("notion-schema", r"notion-schema"),
    ("notion-write", r"notion-write"),
    ("aiRouter", r"aiRouter|ai-router|ai_router"),
    ("notionArchitect", r"notionArchitect|notion-architect|notion_architect"),
    ("dashboard", r"dashboard"),
]

def find_named(root, pattern):
    rx = re.compile(pattern, re.I)
    hits = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP]
        for fn in filenames:
            if rx.search(fn):
                hits.append(os.path.relpath(os.path.join(dirpath, fn), root).replace("\\", "/"))
    return hits

# ---------- 3. HARDCODED VALUES ----------
HARDCODE_PATTERNS = [
    ("supabase-url", r"https://[a-z0-9]+\.supabase\.co"),
    ("notion-db-id", r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"),
    ("api-key-literal", r"(sk-[A-Za-z0-9]{20,}|ntn_[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{50,})"),
    ("localhost", r"localhost:\d+"),
    ("http-url", r"https?://[a-zA-Z0-9\.\-]+"),
]

def find_hardcoded(root):
    results = defaultdict(list)
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
                    content = f.read()
            except Exception:
                continue
            rel = os.path.relpath(p, root).replace("\\", "/")
            for label, pat in HARDCODE_PATTERNS:
                m = re.findall(pat, content)
                if m:
                    results[label].append({"file": rel, "count": len(m), "samples": list(set(m))[:3]})
    return results

# ---------- 4. ENDPOINT / API SURFACE ----------
def find_endpoints(root):
    eps = defaultdict(list)
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
                    content = f.read()
            except Exception:
                continue
            rel = os.path.relpath(p, root).replace("\\", "/")
            # supabase edge function actions
            for m in re.findall(r'action\s*===?\s*[\'"]([a-zA-Z0-9_.\-]+)[\'"]', content):
                eps["edge-action"].append({"file": rel, "value": m})
            # express routes
            for m in re.findall(r'\.(get|post|put|delete|patch)\s*\(\s*[\'"]([^\'"]+)[\'"]', content):
                eps["http-route"].append({"file": rel, "method": m[0].upper(), "path": m[1]})
            # fetch calls
            for m in re.findall(r'fetch\s*\(\s*[`\'"]([^`\'"]+)[`\'"]', content):
                eps["fetch-call"].append({"file": rel, "url": m})
    return eps

report = {}
for name, root in PROJ.items():
    if not os.path.isdir(root):
        report[name] = {"missing": True}
        continue
    print(f"scanning {name}...")
    report[name] = {
        "duplicates": content_hashes(root),
        "named": {label: find_named(root, pat) for label, pat in DUP_PATTERNS},
        "hardcoded": find_hardcoded(root),
        "endpoints": find_endpoints(root),
    }

with open(os.path.join(CLEAN, "audit_deep.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, indent=1)

print("\n=== DUPLICATE FILE CONTENT (identical bytes) ===")
for name, data in report.items():
    if data.get("missing"):
        continue
    dups = data["duplicates"]
    if dups:
        print(f"\n## {name}: {len(dups)} duplicate groups")
        for h, paths in list(dups.items())[:15]:
            print(f"  [{len(paths)} copies] {paths[0]}")
            for p in paths[1:]:
                print(f"      = {p}")

print("\n=== DUPLICATE MODULE NAMES ACROSS PROJECTS ===")
for name, data in report.items():
    if data.get("missing"):
        continue
    print(f"\n## {name}")
    for label, paths in data["named"].items():
        if paths:
            print(f"  {label}: {len(paths)} -> {paths[:6]}")
