import os
import shutil
import glob
import re

clean_root = 'C:/Users/frank/Documents/DigitallyDefinedClean'
shelf_dir = os.path.join(clean_root, 'digital-products', 'shelf')
html_tools_dir = os.path.join(shelf_dir, 'html-tools')
pdf_guides_dir = os.path.join(shelf_dir, 'pdf-guides')
docx_source_dir = os.path.join(shelf_dir, 'docx-source')
brand_review_dir = os.path.join(clean_root, 'brand-review')

os.makedirs(html_tools_dir, exist_ok=True)
os.makedirs(pdf_guides_dir, exist_ok=True)
os.makedirs(docx_source_dir, exist_ok=True)
os.makedirs(brand_review_dir, exist_ok=True)

# 1. Copy all PDF guides from brand-review and Downloads
pdf_sources = [
    'C:/Users/frank/Documents/DigitallyDefinedClean/brand-review/products',
    'C:/Users/frank/Downloads'
]
for src_dir in pdf_sources:
    if os.path.exists(src_dir):
        for f in os.listdir(src_dir):
            if f.lower().endswith('.pdf'):
                src_path = os.path.join(src_dir, f)
                dest_path = os.path.join(pdf_guides_dir, f)
                shutil.copy2(src_path, dest_path)

# 2. Extract metadata for all HTML tools
html_metadata = []
for hfile in sorted(os.listdir(html_tools_dir)):
    p = os.path.join(html_tools_dir, hfile)
    sz = os.path.getsize(p)
    title = hfile.replace('.html', '').replace('_', ' ').title()
    desc = ''
    category = 'Interactive Tool'
    try:
        with open(p, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read(15000)
            m_title = re.search(r'<title[^>]*>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
            if m_title and len(m_title.group(1).strip()) > 3:
                title = m_title.group(1).strip()
            m_meta = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', content, re.IGNORECASE)
            if m_meta:
                desc = m_meta.group(1).strip()
    except Exception as e:
        pass

    # Categorize
    hlower = hfile.lower()
    if 'calc' in hlower or 'roi' in hlower or 'flip' in hlower or 'freedom' in hlower:
        category = 'Calculator / Estimator'
    elif 'architect' in hlower or 'blueprint' in hlower or 'engine' in hlower:
        category = 'Workflow / Business Engine'
    elif 'audit' in hlower or 'snapshot' in hlower or 'positioning' in hlower:
        category = 'Diagnostic / Auditor'
    elif 'prompt' in hlower or 'quest' in hlower or 'kit' in hlower or 'playbook' in hlower or 'guide' in hlower:
        category = 'Playbook / Prompt System'
    elif 'estate' in hlower or 'scam' in hlower or 'thank' in hlower:
        category = 'Lead Magnet / Squeeze'

    html_metadata.append({
        'filename': hfile,
        'title': title,
        'desc': desc,
        'category': category,
        'size': sz,
        'path': f'../digital-products/shelf/html-tools/{hfile}'
    })

# 3. Extract metadata for PDFs
pdf_metadata = []
for pfile in sorted(os.listdir(pdf_guides_dir)):
    p = os.path.join(pdf_guides_dir, pfile)
    sz = os.path.getsize(p)
    title = pfile.replace('.docx.pdf', '').replace('.pdf', '').replace('_', ' ')
    cat = 'Guide / Blueprint'
    if 'checklist' in pfile.lower() or 'cheat' in pfile.lower() or 'bank' in pfile.lower():
        cat = 'Checklist / Asset Kit'
    elif 'keyword' in pfile.lower():
        cat = 'SEO / Keyword Intelligence'
    elif 'retirement' in pfile.lower() or 'empire' in pfile.lower():
        cat = 'Core Curriculum'

    pdf_metadata.append({
        'filename': pfile,
        'title': title,
        'category': cat,
        'size': sz,
        'path': f'../digital-products/shelf/pdf-guides/{pfile}'
    })

# 4. Write Brand Review Portal HTML
portal_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DigitallyDefined — Digital Products & Brand Review Vault</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {{
    --bg: #F4F4F0;
    --card: #FFFFFF;
    --text: #111111;
    --muted: #666666;
    --border: #111111;
    --accent: #FFD21E;
    --font-sans: 'Plus Jakarta Sans', -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    padding: 32px 24px;
    line-height: 1.5;
  }}
  .container {{ max-width: 1300px; margin: 0 auto; }}
  
  /* Soft Brutalism Header */
  .header-card {{
    background: var(--card);
    border: 2px solid var(--border);
    box-shadow: 4px 4px 0 var(--border);
    padding: 32px;
    margin-bottom: 32px;
  }}
  .badge {{
    display: inline-block;
    background: var(--text);
    color: #fff;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }}
  h1 {{ font-size: 32px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 8px; }}
  .subtitle {{ color: var(--muted); font-size: 16px; max-width: 800px; }}
  
  .stats-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-top: 24px;
  }}
  .stat-card {{
    background: #FAFAFA;
    border: 1.5px solid var(--border);
    padding: 16px 20px;
  }}
  .stat-label {{ font-family: var(--font-mono); font-size: 11px; color: var(--muted); text-transform: uppercase; }}
  .stat-val {{ font-size: 24px; font-weight: 800; margin-top: 4px; }}
  
  /* Brand Guidelines Bar */
  .brand-bar {{
    background: #FFFDF0;
    border: 2px solid var(--border);
    box-shadow: 3px 3px 0 var(--border);
    padding: 20px 24px;
    margin-bottom: 32px;
    font-size: 14px;
  }}
  .brand-bar strong {{ color: var(--text); }}
  
  /* Section Header */
  .section-title {{
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    font-weight: 800;
    margin-bottom: 16px;
    font-family: var(--font-sans);
  }}
  .section-tag {{
    font-family: var(--font-mono);
    font-size: 12px;
    background: var(--accent);
    border: 1px solid var(--border);
    padding: 2px 8px;
    font-weight: 700;
  }}
  
  /* Products Grid */
  .products-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }}
  .product-card {{
    background: var(--card);
    border: 2px solid var(--border);
    box-shadow: 4px 4px 0 var(--border);
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }}
  .product-card:hover {{
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 var(--border);
  }}
  .card-top {{ margin-bottom: 16px; }}
  .card-cat {{
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 6px;
  }}
  .card-title {{ font-size: 17px; font-weight: 700; margin-bottom: 8px; line-height: 1.3; }}
  .card-file {{ font-family: var(--font-mono); font-size: 12px; color: #555; word-break: break-all; margin-bottom: 8px; }}
  .card-size {{ font-family: var(--font-mono); font-size: 11px; color: var(--muted); }}
  
  .card-actions {{
    display: flex;
    gap: 10px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #EEE;
  }}
  .btn {{
    display: inline-block;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    border: 1.5px solid var(--border);
    box-shadow: 2px 2px 0 var(--border);
    cursor: pointer;
    text-align: center;
  }}
  .btn-primary {{
    background: var(--accent);
    color: var(--text);
  }}
  .btn-secondary {{
    background: var(--card);
    color: var(--text);
  }}
  .btn:hover {{
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--border);
  }}
</style>
</head>
<body>
<div class="container">
  <div class="header-card">
    <div class="badge">DigitallyDefined · Product Vault</div>
    <h1>Digital Products & Brand Review</h1>
    <p class="subtitle">Complete catalog of interactive HTML tools, diagnostic calculators, Gen X wealth playbooks, and PDF guides recovered and organized for brand alignment review.</p>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Interactive HTML Tools</div>
        <div class="stat-val">{len(html_metadata)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">PDF Guides &amp; Playbooks</div>
        <div class="stat-val">{len(pdf_metadata)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Verified SKUs</div>
        <div class="stat-val">{len(html_metadata) + len(pdf_metadata)}</div>
      </div>
    </div>
  </div>

  <div class="brand-bar">
    <strong>🎨 DigitallyDefined Brand Guideline Audit Criteria:</strong>
    <ul style="margin-top: 8px; margin-left: 20px; line-height: 1.6;">
      <li><strong>Aesthetic:</strong> Soft Brutalism (Clean white cards, 1.5–2px solid black frames, 3–4px hard offset shadows, zero skeuomorphism).</li>
      <li><strong>Typography:</strong> Plus Jakarta Sans / Inter for UI, JetBrains Mono for system metrics &amp; badges. High contrast &amp; ample padding.</li>
      <li><strong>Audience Alignment:</strong> Gen X women (40-60) closing the retirement gap via faceless digital real estate &amp; AI systems. Quiet power, intentional, no hype.</li>
      <li><strong>Monetization &amp; CTA:</strong> Clear pricing tier, standalone value, friction-free purchase paths, and clean Gumroad checkout links.</li>
    </ul>
  </div>

  <div class="section-title">
    <span>⚡ Interactive HTML Tools &amp; Calculators</span>
    <span class="section-tag">{len(html_metadata)} Tools</span>
  </div>
  
  <div class="products-grid">
'''

for item in html_metadata:
    sz_kb = round(item['size'] / 1024, 1)
    portal_html += f'''
    <div class="product-card">
      <div class="card-top">
        <div class="card-cat">{item['category']}</div>
        <div class="card-title">{item['title']}</div>
        <div class="card-file">{item['filename']}</div>
        <div class="card-size">Size: {sz_kb} KB</div>
      </div>
      <div class="card-actions">
        <a href="{item['path']}" target="_blank" class="btn btn-primary">Launch &amp; Review</a>
      </div>
    </div>
'''

portal_html += f'''
  </div>

  <div class="section-title">
    <span>📚 PDF Guides, Playbooks &amp; Lead Magnets</span>
    <span class="section-tag">{len(pdf_metadata)} Guides</span>
  </div>
  
  <div class="products-grid">
'''

for item in pdf_metadata:
    sz_kb = round(item['size'] / 1024, 1)
    portal_html += f'''
    <div class="product-card">
      <div class="card-top">
        <div class="card-cat">{item['category']}</div>
        <div class="card-title">{item['title']}</div>
        <div class="card-file">{item['filename']}</div>
        <div class="card-size">Size: {sz_kb} KB</div>
      </div>
      <div class="card-actions">
        <a href="{item['path']}" target="_blank" class="btn btn-secondary">Open PDF</a>
      </div>
    </div>
'''

portal_html += '''
  </div>
</div>
</body>
</html>
'''

with open(os.path.join(brand_review_dir, 'INDEX.html'), 'w', encoding='utf-8') as f:
    f.write(portal_html)

# Also copy to digital-products/index.html
with open(os.path.join(clean_root, 'digital-products', 'index.html'), 'w', encoding='utf-8') as f:
    f.write(portal_html)

print("Brand Review Portal generated successfully!")
