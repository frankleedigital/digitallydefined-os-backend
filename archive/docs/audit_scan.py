import os, json

ROOTS = {
    "dashboard": "digitallydefined-dashboard",
    "os-backend": "digitallydefined-os-backend",
    "digital-products": "digital-products",
    "os-workers": "digitallydefined-os-workers",
    "backend-clean": "digitallydefined-backend-clean",
}

SKIP = {"node_modules", ".git", "dist", "build", ".next", ".venv", "venv",
        "__pycache__", ".cache", ".turbo", "coverage", ".output", ".vercel"}

def scan(root):
    files = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP]
        for fn in filenames:
            p = os.path.join(dirpath, fn)
            try:
                if os.path.getsize(p) > 3_000_000:
                    continue
                with open(p, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.read().splitlines()
            except Exception:
                continue
            files.append({
                "path": os.path.relpath(p, root).replace("\\", "/"),
                "loc": len(lines),
                "bytes": os.path.getsize(p),
            })
    return files

out = {}
for name, rel in ROOTS.items():
    if not os.path.isdir(rel):
        out[name] = {"missing": True}
        continue
    files = scan(rel)
    total = sum(f["loc"] for f in files)
    files.sort(key=lambda x: -x["loc"])
    out[name] = {
        "file_count": len(files),
        "total_loc": total,
        "top_files": files[:40],
    }

with open("audit_raw.json", "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)

print("--- TOP 25 FILES PER PROJECT ---")
for name, data in out.items():
    if data.get("missing"):
        print(f"\n## {name}: MISSING")
        continue
    print(f"\n## {name} ({data['file_count']} files / {data['total_loc']} LOC)")
    for f in data["top_files"][:25]:
        print(f"  {f['loc']:>7}  {f['path']}")
