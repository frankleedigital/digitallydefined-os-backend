import sqlite3
con = sqlite3.connect('scratch_storage.sqlite')
con.row_factory = sqlite3.Row
tabs = [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")]
keys_tabs = [t for t in tabs if 'key' in t.lower() or 'cred' in t.lower() or 'provider' in t.lower()]
print("KEY/CRED/PROVIDER TABLES:", keys_tabs)
for t in keys_tabs:
    cols = [c[1] for c in con.execute(f"PRAGMA table_info({t})")]
    try:
        n = con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    except Exception as e:
        print(t, "ERR", e); continue
    print(f"\n=== {t} ({n} rows) cols={cols}")
    for r in con.execute(f"SELECT * FROM {t} LIMIT 12"):
        d = dict(r)
        for k in list(d):
            if isinstance(d[k], str) and len(d[k]) > 20:
                d[k] = d[k][:10] + f'...<{len(d[k])}ch>'
        print("  ", d)
