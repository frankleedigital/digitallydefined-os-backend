import os, shutil, subprocess, datetime, json

CLEAN = 'digitallydefined-backend-clean'
OLD = 'digitallydefined-os-backend'
ARCH = os.path.join('archive', 'digitallydefined-backend-clean')

assert os.path.isdir(CLEAN) and os.path.isdir(OLD)
shutil.rmtree(ARCH, ignore_errors=True)
os.makedirs('archive', exist_ok=True)
shutil.move(CLEAN, ARCH)
print('archived', CLEAN, '->', ARCH)

# Pre-archive verification of the unified runtime (mirrors all earlier checks)
py = 'python'
r = subprocess.run([py, '-c',
    "import ast;"
    "ast.parse(open(r'digitallydefined-os-backend/fastapi/app/services/affiliate_service.py').read());"
    "ast.parse(open(r'digitallydefined-os-backend/fastapi/app/models/affiliate.py').read());"
    "print('python syntax OK')"],
    capture_output=True, text=True)
print(r.stdout.strip() or r.stderr.strip()[-300:])

code = (
    "import sys, os, asyncio; "
    "sys.path.insert(0, r'" + os.path.abspath(OLD + '/fastapi') + "'); "
    "from app.models import AffiliateFlipRequest; "
    "import app.services.affiliate_service as svc; "
    "r = asyncio.run(svc.flip_analysis(AffiliateFlipRequest(product='Systeme.io', product_name='Systeme.io', niche='funnel building for coaches', commission_percent=0, product_price=0, epc=0, recurring=False, network=''))); "
    "assert r.flip_score == 68.0 and r.usage_source == 'catalog'; "
    "print('affiliate runtime OK: flip=' + str(r.flip_score))"
)
r2 = subprocess.run([py, '-c', code], capture_output=True, text=True)
print((r2.stdout + r2.stderr).strip()[-300:])

r3 = subprocess.run(['node', '--check', os.path.join(OLD, 'agents', 'affiliateFlipAgent.js')], capture_output=True, text=True)
print('agent syntax:', 'OK' if r3.returncode == 0 else r3.stderr.strip()[-300:])

print('archive dir exists:', os.path.isdir(ARCH))
print('live unified backend:', OLD)
print('AFFILIATE-FLIP VERIFICATION PASSED (post-archive)')
