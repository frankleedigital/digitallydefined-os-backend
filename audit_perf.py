import os, re

CLEAN = r"C:\Users\frank\Documents\DigitallyDefinedClean"
DASH = os.path.join(CLEAN, "digitallydefined-dashboard")
BE = os.path.join(CLEAN, "digitallydefined-os-backend")

def stats(path, label):
    c = open(path, encoding="utf-8", errors="ignore").read()
    lines = c.splitlines()
    print(f"\n=== {label} ({len(lines)} LOC) ===")
    print(f"  inline style objects : {len(re.findall(r'style={{', c))}")
    print(f"  useState             : {len(re.findall(r'useState[(]', c))}")
    print(f"  useEffect            : {len(re.findall(r'useEffect[(]', c))}")
    print(f"  useMemo              : {len(re.findall(r'useMemo[(]', c))}")
    print(f"  useCallback           : {len(re.findall(r'useCallback[(]', c))}")
    print(f"  JSX components <X     : {len(re.findall(r'<[A-Z]', c))}")
    print(f"  fetch calls          : {len(re.findall(r'fetch[(]', c))}")
    print(f"  console.log          : {len(re.findall(r'console[.]log', c))}")
    print(f"  TODO/FIXME/HACK      : {len(re.findall(r'TODO|FIXME|HACK|XXX', c))}")
    print(f"  action === branches  : {len(re.findall(r'action ===', c))}")
    print(f"  action.startsWith    : {len(re.findall(r'action[.]startsWith', c))}")
    print(f"  try/catch blocks     : {len(re.findall(r'try[{]', c))}")
    print(f"  inline functions =>  : {len(re.findall(r'=>', c))}")
    return c

stats(os.path.join(DASH, "src", "pages", "DashboardPage.jsx"), "DashboardPage.jsx")
stats(os.path.join(DASH, "src", "pages", "NotionTab.jsx"), "NotionTab.jsx")
stats(os.path.join(DASH, "src", "pages", "AntigravityPage.jsx"), "AntigravityPage.jsx")
stats(os.path.join(DASH, "src", "pages", "AssistantPage.jsx"), "AssistantPage.jsx")
stats(os.path.join(DASH, "src", "config.js"), "config.js")
stats(os.path.join(DASH, "src", "index.css"), "index.css")
stats(os.path.join(BE, "api", "index.js"), "os-backend api/index.js")
stats(os.path.join(BE, "supabase", "functions", "hermes", "index.ts"), "hermes edge fn")
stats(os.path.join(BE, "lib", "sync-aggregator.js"), "lib/sync-aggregator.js")
stats(os.path.join(BE, "supabase", "functions", "_shared", "sync-aggregator.ts"), "_shared/sync-aggregator.ts")
stats(os.path.join(BE, "src", "routes", "_original-index-backup.js"), "_original-index-backup.js")
stats(os.path.join(BE, "src", "config", "env.js"), "src/config/env.js")
stats(os.path.join(BE, "fastapi", "app", "main.py"), "fastapi/app/main.py")
stats(os.path.join(BE, "src", "services", "aiRouter.js"), "src/services/aiRouter.js")
stats(os.path.join(BE, "src", "services", "antigravity.js"), "src/services/antigravity.js")

# CSS specifics
css = open(os.path.join(DASH, "src", "index.css"), encoding="utf-8", errors="ignore").read()
print("\n=== index.css specifics ===")
print(f"  CSS custom props (--dd-*) : {len(re.findall(r'--dd-[a-z-]+:', css))}")
print(f"  box-shadow declarations   : {len(re.findall(r'box-shadow', css))}")
print(f"  border-radius declarations: {len(re.findall(r'border-radius', css))}")
print(f"  !important               : {len(re.findall(r'!important', css))}")
print(f"  media queries             : {len(re.findall(r'@media', css))}")
print(f"  @keyframes               : {len(re.findall(r'@keyframes', css))}")
print(f"  class selectors           : {len(re.findall(r'[.][a-zA-Z][a-zA-Z0-9_-]*[{,]', css))}")

# FastAPI main
fm = open(os.path.join(BE, "fastapi", "app", "main.py"), encoding="utf-8", errors="ignore").read()
print("\n=== fastapi/app/main.py specifics ===")
print(f"  include_router           : {len(re.findall(r'include_router', fm))}")
print(f"  CORS allow_origins       : {re.findall(r'allow_origins[ ]*=[ ]*(\[[^\]]*\])', fm)}")
print(f"  middleware               : {len(re.findall(r'@app[.](?:get|post|middleware)', fm))}")
