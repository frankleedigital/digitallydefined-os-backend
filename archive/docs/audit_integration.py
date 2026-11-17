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
        ".hermes", "output", "archive", "workspace", "__pycache__"}

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

# ---- 1. ALLOWED_ACTIONS registry in api/index.js ----
api_index = os.path.join(PROJ["os-backend"], "api", "index.js")
actions = []
if os.path.exists(api_index):
    content = open(api_index, encoding="utf-8", errors="ignore").read()
    m = re.search(r"ALLOWED_ACTIONS\s*=\s*(\[.*?\])", content, re.S)
    if m:
        actions = re.findall(r"['\"]([a-zA-Z0-9_.\-]+)['\"]", m.group(1))
    print(f"api/index.js ALLOWED_ACTIONS: {len(actions)}")
    print(sorted(set(actions)))

# ---- 2. Which actions are actually referenced by dashboard / digital-products ----
used = defaultdict(set)
for name, root in PROJ.items():
    for rel, content in walk(root, {".js", ".jsx", ".ts", ".tsx"}):
        for a in actions:
            if re.search(r"['\"]" + re.escape(a) + r"['\"]", content):
                used[a].add(name)

print("\n=== ACTION USAGE BY FRONTEND ===")
for a in sorted(actions):
    users = sorted(used.get(a, []))
    if users:
        print(f"  {a:38} <- {', '.join(users)}")
unused = [a for a in actions if not used.get(a)]
print(f"\n=== ACTIONS NOT REFERENCED BY ANY FRONTEND ({len(unused)}) ===")
print(sorted(unused))

# ---- 3. FastAPI routers + endpoints ----
fastapi_dir = os.path.join(PROJ["os-backend"], "fastapi", "app")
print("\n=== FASTAPI ROUTERS ===")
for rel, content in walk(fastapi_dir, {".py"}):
    eps = re.findall(r"@router\.(get|post|put|delete|patch)\s*\(\s*[\"']([^\"']+)[\"']", content)
    if eps:
        print(f"  {rel}: {len(eps)} endpoints")
        for meth, path in eps[:6]:
            print(f"      {meth.upper():6} {path}")

# ---- 4. Supabase edge function actions ----
print("\n=== SUPABASE EDGE FUNCTION ACTIONS ===")
sf_dir = os.path.join(PROJ["os-backend"], "supabase", "functions")
for fn in sorted(os.listdir(sf_dir)):
    fdir = os.path.join(sf_dir, fn)
    if not os.path.isdir(fdir):
        continue
    idx = None
    for cand in ("index.ts", "index.js"):
        if os.path.exists(os.path.join(fdir, cand)):
            idx = os.path.join(fdir, cand)
            break
    if not idx:
        continue
    content = open(idx, encoding="utf-8", errors="ignore").read()
    acts = sorted(set(re.findall(r"action\s*===?\s*[\"']([a-zA-Z0-9_.\-]+)[\"']", content)))
    if acts:
        print(f"  {fn}: {acts}")

# ---- 5. Cross-project API URL references ----
print("\n=== API URL REFERENCES ===")
for name, root in PROJ.items():
    hits = defaultdict(list)
    for rel, content in walk(root, {".js", ".jsx", ".ts", ".tsx", ".html", ".json"}):
        for m in re.findall(r"https://[a-zA-Z0-9\.\-]+\.vercel\.app", content):
            hits[m].append(rel)
        for m in re.findall(r"VITE_API_URL[^\n]{0,120}", content):
            hits["VITE_API_URL"].append(rel + " :: " + m.strip()[:100])
    if hits:
        print(f"\n  ## {name}")
        for url, files in hits.items():
            print(f"    {url}: {len(files)} files -> {files[:4]}")

# ---- 6. Env var usage vs declaration ----
print("\n=== ENV VAR DECLARATION vs USAGE ===")
declared = defaultdict(set)
used_env = defaultdict(set)
ENV_PAT = re.compile(r"(?:Deno\.env\.get|import\.meta\.env|process\.env|os\.environ(?:\.get)?)\s*[\(\.\[\s]*[\"']?([A-Z0-9_]{3,})[\"']?")
for name, root in PROJ.items():
    for rel, content in walk(root, {".js", ".jsx", ".ts", ".tsx", ".py", ".mjs", ".cjs"}):
        for m in ENV_PAT.findall(content):
            used_env[m].add(name)
    # declared in .env files
    for dp, dn, fn in os.walk(root):
        dn[:] = [d for d in dn if d not in SKIP]
        for f in fn:
            if f.startswith(".env"):
                p = os.path.join(dp, f)
                try:
                    for line in open(p, encoding="utf-8", errors="ignore"):
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k = line.split("=", 1)[0].strip()
                            if k:
                                declared[k].add(name)
                except Exception:
                    pass
print("\n  USED but NOT DECLARED anywhere:")
for k in sorted(used_env):
    if k not in declared:
        print(f"    {k}  (used in: {', '.join(sorted(used_env[k]))})")
print("\n  DECLARED but never referenced in code:")
for k in sorted(declared):
    if k not in used_env:
        print(f"    {k}  (declared in: {', '.join(sorted(declared[k]))})")
