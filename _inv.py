import os

def inventory(base):
    out = []
    for root, dirs, files in os.walk(base):
        # prune noise dirs
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', '.venv', '.venv-1', '.kilo', '.vercel', '__pycache__', '.turbo', 'dist', 'build')]
        if any(x in root for x in ('node_modules', '.git', '.venv', '.kilo', '__pycache__')):
            continue
        rel = os.path.relpath(root, base)
        for fn in sorted(files):
            if fn.endswith(('.pyc', '.pyo')):
                continue
            p = os.path.join(rel, fn) if rel != '.' else fn
            try:
                sz = os.path.getsize(os.path.join(root, fn))
            except OSError:
                sz = -1
            out.append((p, sz))
    return out

for base in ['digitallydefined-backend-clean', 'digitallydefined-os-backend']:
    inv = inventory(base)
    with open(base.replace('-', '_') + '_inventory.txt', 'w', encoding='utf-8') as f:
        for p, sz in inv:
            f.write(str(sz).rjust(10) + '  ' + p + '\n')
    print(base, '->', len(inv), 'files')
