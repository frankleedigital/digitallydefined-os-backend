# PDF Intelligence Engine — R2 Integration Architecture

## 1. Connection to R2
The PDF Intelligence Engine (future) will use the existing R2 storage service (`lib/r2Storage.js` for Node, `app/services/r2_storage.py` for Python/FastAPI). All file I/O goes through R2; local disk is used only as a temporary processing workspace.

## 2. Bucket structure
/pdf-engine/uploads        # raw user-uploaded PDFs
/pdf-engine/extracted-text # extracted text/JSON output
/pdf-engine/exports        # converted/exported files
/pdf-engine/reports        # generated analysis reports
/pdf-engine/customer-files # delivered customer assets

## 3. Workflow
User Upload -> R2 (pdf-engine/uploads)
Processing  -> Temporary local workspace (auto-deleted)
Generated Assets -> R2 (extracted-text / exports / reports)
Download Links -> Signed URLs (time-limited)

## 4. Required API endpoints
- POST /pdf/upload          -> returns R2 key + signed upload URL
- POST /pdf/process/:key   -> triggers extraction, stores results in R2
- GET  /pdf/status/:id     -> processing status
- GET  /pdf/download/:key  -> signed download URL
- DELETE /pdf/:key         -> remove object

## 5. Environment variables
R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
Plus: PDF_ENGINE_MAX_SIZE_MB, PDF_ENGINE_TEMP_DIR, PDF_ENGINE_SIGNED_URL_TTL

## 6. Security considerations
- Auth required (Supabase, authorized account only) for all endpoints.
- Signed URLs with short TTL (<=1h) for downloads.
- Validate file type/size on upload; reject non-PDF.
- Scan uploads; isolate temp workspace; auto-cleanup.
- Least-privilege R2 credentials scoped to bucket prefix.
- Never expose R2 credentials to client.

## 7. Future implementation recommendations
- Add a queue (Redis/Bull) for async processing.
- Store job metadata in Supabase (status, keys, timestamps).
- Add R2 lifecycle rule to auto-delete temp/ after 24h.
- Implement retry + idempotency for processing.
- Add virus scanning step before processing.
- Monitor R2 usage/costs; alert on anomalies.
