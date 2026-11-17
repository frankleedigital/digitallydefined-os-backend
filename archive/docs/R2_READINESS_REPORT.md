# R2 Production-Readiness Audit

## Remaining local filesystem storage
- fastapi/app/services/product_packager.py -> writes to OUTPUT_DIR (local)
- os-backend/roadmaps/store.js -> fs.writeFile JSON (local)
- os-backend/src/services/websiteEditor.js -> fs.writeFileSync (local)
- supabase/functions _shared roadmaps-store.ts -> fs.writeFileSync (local, archived)

## Uploads not routed through R2
- product_packager generated packages
- roadmap JSON persistence
- website editor content

## PDFs/exports
- No PDF generation currently routes to R2 (PDF Intelligence Engine not yet integrated with r2Storage).

## Temp files
- No automated cleanup job; temp/ prefix defined but no lifecycle rule configured in R2.

## Migration scripts
- scripts/migrate-to-r2.mjs exists but basic; no DB reference updates, no integrity verification.

## Backup/DR recommendation
- Enable R2 versioning + lifecycle rules; replicate bucket to secondary region; nightly manifest export; test restore quarterly.

## Architecture diagram
Client -> os-backend (node) -> R2 (prefixes: uploads/generated/pdfs/exports/images/lead-magnets/customer-assets/temp)
FastAPI -> R2 (generated packages)
Supabase DB stores object keys (not bytes).

## Readiness score: 60%
Core R2 service validated (upload/download/delete/signed URL). Remaining work: route all local writes through R2, integrate PDF engine, add lifecycle/cleanup, complete migration scripts with DB updates.
