# R2 Storage Architecture

Prefixes: uploads/, generated/, pdfs/, exports/, images/, lead-magnets/, customer-assets/, temp/

Access patterns:
- uploads: user-submitted files, private, signed URLs
- generated: AI outputs, private
- pdfs: PDF Intelligence Engine output, signed URLs for download
- exports: reports, signed URLs
- images: public-ish assets, may be public bucket policy
- lead-magnets: delivered via signed URL after opt-in
- customer-assets: purchased digital products
- temp: short-lived, cleaned up

Env vars: R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY

Local dev: set env vars in .env.local; run backend directly.

Docker: docker-compose up with env_file .env.

Troubleshooting: missing env → validateEnv throws; check credentials; verify endpoint includes account id.
