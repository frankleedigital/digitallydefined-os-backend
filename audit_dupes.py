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

# 1. Duplicated business logic: same function names in multiple files
FN_PAT = re.compile(r"^(?:export\s+)?(?:async\s+)?function\s+(\w+)|^(\w+)\s*=\s*(?:async\s*)?\(", re.M)
fn_index = defaultdict(list)
for name, root in PROJ.items():
    for rel, c in walk(root, {".js", ".jsx", ".ts", ".tsx", ".py", ".mjs"}):
        for m in FN_PAT.finditer(c):
            fn = m.group(1) or m.group(2)
            if fn and len(fn) > 6 and not fn.startswith("use") and fn not in ("if", "for", "while", "switch", "catch", "return", "function", "const", "let", "var"):
                fn_index[fn].append(f"{name}:{rel}")

INTERESTING = ["verifyLicense", "fetchDashboard", "handleDashboard", "syncNotion", "sendEmail",
               "verifyGumroad", "fetchNotionSnapshot", "buildDashboardPayload", "getEntitlement",
               "normalizeProperties", "mapNotionPage", "scoreNiche", "generateRoadmap",
               "processQuiz", "fetchBrevoStats", "fetchSocialStats", "fetchGoogleAnalytics",
               "resolveModel", "callAI", "chatCompletion", "getAgent", "executeAgent",
               "createNotionPage", "updateNotionPage", "queryNotionDatabase", "buildSchema",
               "validateSchema", "formatCurrency", "formatPercent", "safeNumber"]

print("=== DUPLICATED FUNCTION NAMES ACROSS PROJECTS ===")
for fn in INTERESTING:
    hits = fn_index.get(fn, [])
    if len(hits) > 1:
        print(f"\n  {fn} ({len(hits)} definitions):")
        for h in hits[:12]:
            print(f"     {h}")

# 2. Cross-project duplicated files by basename
print("\n\n=== SAME BASENAME IN MULTIPLE PROJECTS ===")
by_base = defaultdict(list)
for name, root in PROJ.items():
    for rel, c in walk(root, {".js", ".jsx", ".ts", ".tsx", ".py", ".mjs", ".css"}):
        by_base[os.path.basename(rel)].append(f"{name}:{rel}")
for base, hits in sorted(by_base.items()):
    projs = set(h.split(":")[0] for h in hits)
    if len(projs) > 1 and base not in ("package.json", "package-lock.json", "index.html", "README.md", "vite.config.js", "tsconfig.json", "main.jsx", "App.jsx"):
        print(f"  {base}: {hits}")

# 3. Hardcoded price points
print("\n\n=== HARDCODED PRICE POINTS ===")
PRICE_PAT = re.compile(r"\$\s?(\d{2,4})")
for name, root in PROJ.items():
    agg = defaultdict(list)
    for rel, c in walk(root, {".js", ".jsx", ".ts", ".tsx", ".py", ".mjs", ".html"}):
        for m in set(PRICE_PAT.findall(c)):
            agg[m].append(rel)
    if agg:
        print(f"\n  ## {name}")
        for price, files in sorted(agg.items(), key=lambda x: -len(x[1])):
            print(f"    ${price}: {len(files)} files -> {files[:5]}")

# 4. localStorage keys (state contract)
print("\n\n=== LOCALSTORAGE / STORAGE KEYS ===")
LS_PAT = re.compile(r"(?:localStorage|localForage)\.(?:getItem|setItem|removeItem)\s*\(\s*['\"]([^'\"]+)['\"]")
for name, root in PROJ.items():
    keys = defaultdict(list)
    for rel, c in walk(root, {".js", ".jsx", ".ts", ".tsx"}):
        for m in LS_PAT.findall(c):
            keys[m].append(rel)
    if keys:
        print(f"\n  ## {name}")
        for k, files in sorted(keys.items()):
            print(f"    {k}: {len(files)} -> {files[:4]}")

# 5. Render counts / heavy patterns in dashboard
print("\n\n=== DASHBOARD RENDER / PERF SIGNALS ===")
dp = os.path.join(PROJ["dashboard"], "src", "pages", "DashboardPage.jsx")
c = open(dp, encoding="utf-8", errors="ignore").read()
print(f"  DashboardPage.jsx: {len(c.splitlines())} LOC")
print(f"  inline style={{}} objects: {len(re.findall(r'style=\\{\\{', c))}")
print(f"  useState: {len(re.findall(r'useState\\(', c))}")
print(f"  useEffect: {len(re.findall(r'useEffect\\(', c))}")
print(f"  useMemo: {len(re.findall(r'useMemo\\(', c))}")
print(f"  useCallback: {len(re.findall(r'useCallback\\(', c))}")
print(f"  JSX elements: {len(re.findall(r'<[A-Z]', c))}")
print(f"  fetch calls: {len(re.findall(r'fetch\\(', c))}")
print(f"  console.log: {len(re.findall(r'console\\.log', c))}")
print(f"  TODO/FIXME/HACK: {len(re.findall(r'TODO|FIXME|HACK|XXX', c))}")

# 6. index.css duplication with theme.js
css = open(os.path.join(PROJ["dashboard"], "src", "index.css"), encoding="utf-8", errors="ignore").read()
print(f"\n  index.css: {len(css.splitlines())} LOC")
print(f"  CSS var definitions: {len(re.findall(r'--dd-[a-z-]+:', css))}")
print(f"  box-shadow declarations: {len(re.findall(r'box-shadow', css))}")
print(f"  border-radius declarations: {len(re.findall(r'border-radius', css))}")
print(f"  !important: {len(re.findall(r'!important', css))}")

# 7. os-backend api/index.js handler size
api = open(os.path.join(PROJ["os-backend"], "api", "index.js"), encoding="utf-8", errors="ignore").read()
print(f"\n  api/index.js: {len(api.splitlines())} LOC")
print(f"  action === branches: {len(re.findall(r'action ===', api))}")
print(f"  action.startsWith: {len(re.findall(r'action\\.startsWith', api))}")
print(f"  fetch calls: {len(re.findall(r'fetch\\(', api))}")
print(f"  console.log: {len(re.findall(r'console\\.log', api))}")
print(f"  TODO/FIXME: {len(re.findall(r'TODO|FIXME|HACK', api))}")

# 8. Supabase hermes function size
hermes = open(os.path.join(PROJ["os-backend"], "supabase", "functions", "hermes", "index.ts"), encoding="utf-8", errors="ignore").read()
print(f"\n  supabase/functions/hermes/index.ts: {len(hermes.splitlines())} LOC")
print(f"  action === branches: {len(re.findall(r'action ===', hermes))}")
print(f"  console.log/warn: {len(re.findall(r'console\\.(log|warn)', hermes))}")
print(f"  TODO/FIXME: {len(re.findall(r'TODO|FIXME|HACK', hermes))}")

# 9. FastAPI main.py
fmain = open(os.path.join(PROJ["os-backend"], "fastapi", "app", "main.py"), encoding="utf-8", errors="ignore").read()
print(f"\n  fastapi/app/main.py: {len(fmain.splitlines())} LOC")
print(f"  router includes: {len(re.findall(r'include_router', fmain))}")
print(f"  CORS origins: {re.findall(r'allow_origins\s*=\s*(\[[^\]]*\])', fmain)}")
