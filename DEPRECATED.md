## Deprecated

This project has been superseded by **digitallydefined-backend-clean**.

All active development, environment variables, and deployments now use the clean backend.

### What was here
- Original AI routing (Hermes edge functions on Supabase)
- Legacy API routes (api/index.js)
- Supabase edge functions (supabase/functions/) - STILL THE CANONICAL LOCATION for edge function deploys

### Where to go
- Backend code: digitallydefined-backend-clean/
- Supabase functions: deploy from digitallydefined-os-backend/supabase/ (same codebase, just the deploy command runs from here)
- Env vars: digitallydefined-backend-clean/.env

### Why
- Dual Supabase CLI link state caused function overwrite conflicts
- OmniRoute disabled in old code; now primary in clean
- Consolidated env vars removed duplicate/stale entries
