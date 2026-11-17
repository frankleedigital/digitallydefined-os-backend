import os
import shutil
import glob
import re

clean_root = 'C:/Users/frank/Documents/DigitallyDefinedClean'
shelf_dir = os.path.join(clean_root, 'digital-products', 'shelf')
html_tools_dir = os.path.join(shelf_dir, 'html-tools')
pdf_guides_dir = os.path.join(shelf_dir, 'pdf-guides')
docx_source_dir = os.path.join(shelf_dir, 'docx-source')

os.makedirs(html_tools_dir, exist_ok=True)
os.makedirs(pdf_guides_dir, exist_ok=True)
os.makedirs(docx_source_dir, exist_ok=True)

dl_dir = 'C:/Users/frank/Downloads'

# 1. HTML Tools mapping (source -> clean name)
html_sources = {
    'AI-Agent-Pricing-Positioning-Worksheet.html': 'ai_agent_pricing_positioning_worksheet.html',
    'automated_wealth_snapshot (1).html': 'automated_wealth_snapshot.html',
    'automated_wealth_snapshot.html': 'automated_wealth_snapshot.html',
    'clicks-to-conversion.html': 'clicks_to_conversion.html',
    'dd_buyer_style_asset_auditor (1).html': 'dd_buyer_style_asset_auditor.html',
    'dd_buyer_style_asset_auditor.html': 'dd_buyer_style_asset_auditor.html',
    'digital_asset_audit_simulator.html': 'digital_asset_audit_simulator.html',
    'digital_business_plan_architect.html': 'digital_business_plan_architect.html',
    'digital_deeds_guide.html': 'digital_deeds_guide.html',
    'digital_empire_blueprint.html': 'digital_empire_blueprint.html',
    'digital_landlord_playbook.html': 'digital_landlord_playbook.html',
    'digitallydefined_automated_asset_engine (1).html': 'automated_asset_engine.html',
    'digitallydefined_automated_asset_engine.html': 'automated_asset_engine.html',
    'digitallydefined_product_architect (1) (1).html': 'digitallydefined_product_architect.html',
    'genx_prompts.html': 'genx_50_ai_prompts.html',
    'intent_to_income_platform.html': 'intent_to_income_platform.html',
    'lead-magnet-1-estate-documents.html': 'estate_documents_for_gen_x.html',
    'lead-magnet-2-scam-96-hour-plan.html': 'scam_response_96_hour_plan.html',
    'legacy_os_bundle_landing_v2.html': 'legacy_os_bundle_landing.html',
    'legacy_os_phase1_mvp.html': 'legacy_os_phase1_mvp.html',
    'the_faceless_business_launch_kit.html': 'the_faceless_business_launch_kit.html',
    'funding_navigator.html': 'funding_navigator.html'
}

for src_name, clean_name in html_sources.items():
    p = os.path.join(dl_dir, src_name)
    if os.path.exists(p):
        shutil.copy2(p, os.path.join(html_tools_dir, clean_name))
        print(f'Copied HTML: {src_name} -> {clean_name}')

# Check other known HTML tools in the repo
extra_html = [
    ('C:/Users/frank/Documents/DigitallyDefinedClean/digitallydefined-dashboard/public/10x-roi-calculator.html', '10x_roi_calculator.html'),
    ('C:/Users/frank/Documents/DigitallyDefinedClean/digitallydefined-dashboard/public/affiliate-flip-calculator.html', 'affiliate_flip_calculator.html'),
    ('C:/Users/frank/Documents/DigitallyDefinedClean/digitallydefined-dashboard/public/thank-you.html', 'roi_calculator_thank_you.html'),
    ('C:/Users/frank/Documents/DigitallyDefinedClean/digitallydefined-os-backend/.hermes/desktop-attachments/digital-wealth-toolkit.html', 'digital_wealth_toolkit.html'),
    ('C:/Users/frank/Documents/DigitallyDefinedClean/digitallydefined-os-backend/.hermes/desktop-attachments/freedom_number_calculator.html', 'freedom_number_calculator.html'),
    ('C:/Users/frank/Documents/DigitallyDefinedClean/digitallydefined-os-backend/.hermes/desktop-attachments/keyword_quest_digital_real_estate_edition.html', 'keyword_quest_digital_real_estate.html'),
]

for src, clean in extra_html:
    if os.path.exists(src):
        shutil.copy2(src, os.path.join(html_tools_dir, clean))
        print(f'Copied Extra HTML: {os.path.basename(src)} -> {clean}')

# 2. PDF Guides from Downloads and brand-review
if os.path.exists(dl_dir):
    for pdf in os.listdir(dl_dir):
        if pdf.lower().endswith('.pdf'):
            src = os.path.join(dl_dir, pdf)
            shutil.copy2(src, os.path.join(pdf_guides_dir, pdf))
            print(f'Copied PDF from Downloads: {pdf}')

brand_rev = os.path.join(clean_root, 'brand-review')
if os.path.exists(brand_rev):
    for f in os.listdir(brand_rev):
        if f.lower().endswith('.pdf'):
            src = os.path.join(brand_rev, f)
            dest = os.path.join(pdf_guides_dir, f)
            if not os.path.exists(dest):
                shutil.copy2(src, dest)
                print(f'Copied PDF from brand-review: {f}')

# 3. DOCX Files
if os.path.exists(dl_dir):
    for d in os.listdir(dl_dir):
        if d.lower().endswith('.docx'):
            src = os.path.join(dl_dir, d)
            shutil.copy2(src, os.path.join(docx_source_dir, d))
            print(f'Copied DOCX from Downloads: {d}')

print('\n=== SUMMARY OF SHELF ===')
print('HTML Tools:', len(os.listdir(html_tools_dir)))
for f in sorted(os.listdir(html_tools_dir)):
    print('  - HTML:', f)
print('\nPDF Guides:', len(os.listdir(pdf_guides_dir)))
for f in sorted(os.listdir(pdf_guides_dir)):
    print('  - PDF:', f)
print('\nDOCX Sources:', len(os.listdir(docx_source_dir)))
for f in sorted(os.listdir(docx_source_dir)):
    print('  - DOCX:', f)
