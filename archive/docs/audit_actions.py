import os, re, json
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

def walk(root, exts=None):
    for dp, dn, fn in os.walk(root):
        dn[:] = [d for d in dn if d not in SKIP]
        for f in fn:
            if exts and os.path.splitext(f)[1].lower() not in exts:
                continue
            p = os.path.join(dp, f)
            try:
                if os.path.getsize(p) > 3_000_000:
                    continue
                yield os.path.relpath(p, root).replace("\\", "/"), open(p, "r", encoding="utf-8", errors="ignore").read()
            except Exception:
                pass

# 1. Extract ALLOWED_ACTIONS properly (Set([...]))
api_index = os.path.join(PROJ["os-backend"], "api", "index.js")
content = open(api_index, encoding="utf-8", errors="ignore").read()
m = re.search(r"ALLOWED_ACTIONS\s*=\s*new Set\(\[(.*?)\]\)", content, re.S)
actions = re.findall(r"['\"]([a-zA-Z0-9_.\-]+)['\"]", m.group(1)) if m else []
actions = sorted(set(actions))
print(f"ALLOWED_ACTIONS ({len(actions)}):")
print(json.dumps(actions, indent=1))

# 2. Frontend usage
used = defaultdict(set)
for name, root in PROJ.items():
    for rel, c in walk(root, {".js", ".jsx", ".ts", ".tsx"}):
        for a in actions:
            if re.search(r"['\"]" + re.escape(a) + r"['\"]", c):
                used[a].add(name)
print("\n=== ACTIONS USED BY FRONTENDS ===")
for a in actions:
    u = sorted(used.get(a, []))
    print(f"  {a:40} {', '.join(u) if u else '--- UNUSED ---'}")

# 3. action-registry.ts (claimed single source of truth)
reg = os.path.join(PROJ["os-backend"], "supabase", "functions", "_shared", "action-registry.ts")
if os.path.exists(reg):
    rc = open(reg, encoding="utf-8", errors="ignore").read()
    reg_acts = sorted(set(re.findall(r"['\"]([a-zA-Z0-9_.\-]+)['\"]", rc)))
    print(f"\n=== action-registry.ts ({len(reg_acts)} strings) ===")
    print(reg_acts[:60])
    only_api = [a for a in actions if a not in reg_acts]
    print(f"\nIn api/index.js but NOT in action-registry.ts: {only_api}")
else:
    print("\naction-registry.ts NOT FOUND")

# 4. DashboardPage.jsx structure
dp = os.path.join(PROJ["dashboard"], "src", "pages", "DashboardPage.jsx")
c = open(dp, encoding="utf-8", errors="ignore").read()
print(f"\n=== DashboardPage.jsx: {len(c.splitlines())} LOC ===")
print("imports:", len(re.findall(r"^import ", c, re.M)))
print("useEffect:", len(re.findall(r"useEffect\(", c)))
print("useState:", len(re.findall(r"useState\(", c)))
print("fetch calls:", len(re.findall(r"fetch\(", c)))
print("inline style objects:", len(re.findall(r"style=\{\{", c)))
print("function definitions:", len(re.findall(r"^(?:const|function)\s+\w+\s*=", c, re.M)))
# list top-level component/const names
names = re.findall(r"^(?:const|function)\s+([A-Z]\w+)", c, re.M)
print("top-level components:", names[:40])

# 5. Duplicate logic: notion client implementations
print("\n=== NOTION CLIENT IMPLEMENTATIONS ===")
for name, root in PROJ.items():
    for rel, c in walk(root, {".js", ".jsx", ".ts", ".tsx", ".py", ".mjs"}):
        if "api.notion.com" in c:
            print(f"  {name}: {rel} ({len(c.splitlines())} LOC)")

# 6. Email provider implementations
print("\n=== EMAIL PROVIDER IMPLEMENTATIONS ===")
for name, root in PROJ.items():
    for rel, c in walk(root, {".js", ".jsx", ".ts", ".tsx", ".py", ".mjs"}):
        hits = []
        for prov, needle in [("brevo", "api.brevo.com"), ("sendgrid", "api.sendgrid.com"), ("mailchimp", "mailchimp"), ("smtp", "smtp")]:
            if needle in c.lower():
                hits.append(prov)
        if hits:
            print(f"  {name}: {rel} -> {hits}")

# 7. AI router implementations
print("\n=== AI ROUTER IMPLEMENTATIONS ===")
for name, root in PROJ.items():
    for rel, c in walk(root, {".js", ".jsx", ".ts", ".tsx", ".py", ".mjs"}):
        if re.search(r"(omniroute|openrouter|OMNIROUTE_URL|OPENROUTER_API_KEY)", c, re.I):
            print(f"  {name}: {rel} ({len(c.splitlines())} LOC)")
