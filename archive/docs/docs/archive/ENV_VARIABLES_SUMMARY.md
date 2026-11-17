# Supabase Edge Function - Environment Variables Summary

## Migrated from Backend

### Source Files
- `DigitallyDefined-Backend/.env` (50 variables)
- `DigitallyDefined-Backend/.env.local` (72 variables)

### Migrated to Edge Function
- **37 environment variables** referenced in `functions/hermes.ts`

---

## Complete Variable List

### Required (Set these first)
```
DASHBOARD_API_KEY=[REDACTED]
SUPABASE_URL=https://dijjlppdljpcgyoakdnq.supabase.co
SUPABASE_ANON_KEY=eyJhbG...qWIY
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...wdIM
```

### AI Providers (For Chat Functionality)
```
OPENROUTER_API_KEY=[REDACTED]
ANTHROPIC_API_KEY=[REDACTED]
AGNES_API_KEY=[REDACTED]
BLUESMINDS_API_KEY=[REDACTED]
NOVITA_API_KEY=[REDACTED]
NOVITA_BASE_URL=https://api.novita.ai/openai/v1
MISTRAL_API_KEY=[REDACTED]
GROQ_API_KEY=[REDACTED]
```

### Integrations
```
SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbw.../exec
NOTION_API_KEY=[REDACTED]
NOTION_IDEAS_DB=f280d0cb95648309a269012a84b42471
NOTION_CONTENT_DB=eb50d0cb95648359964e81193eeccf37
NOTION_AUTOMATIONS_DB=10c0d0cb956482d79e6b01b578ccb2f0
NOTION_REVIEWS_DB=36f0d0cb956483de960001817da649a2
NOTION_OS_COMMANDS_DB=476db5e2a54a408c88de55a6daf983ff
NOTION_COMMAND_CENTER_DB_ID=112ceac97a4f460e9b2acfc78faa7c52
NOTION_PUBLISHING_QUEUE_DB_ID=
NOTION_CONTENT_APPROVALS_DB_ID=
NOTION_BUYER_SIGNALS_DB_ID=
NOTION_AI_CONTENT_DRAFTS_DB_ID=
```

### Social Media
```
FACEBOOK_ACCESS_TOKEN=
FACEBOOK_PAGE_ID=
FACEBOOK_PAGE_USERNAME=
INSTAGRAM_USERNAME=digitally.defined
INSTAGRAM_BUSINESS_ACCOUNT_ID=
META_APP_ID=1251778236851904
THREADS_APP_ID=4204436683151598
THREADS_APP_SECRET=e1de6db6a1e0fe3d1d922aa09594342e
THREADS_ACCESS_TOKEN=THAA7v6bL62O5BYmJZANmRtanFqU1RkME5lNTdaU3NwTGNrUzhkeFQzaEJWaWg1SGdkOGM3VXd0eG8yNGhLVE9FMGhrTE5Wd1NRUk5uQThKQjhBWDI1T0FqMUNQTTF3UmM4V0p1amRVRHlvZAlN1am9KLVFRV3NnVC1BdnZACSllTMUdpLTdVYjQwSkRmV0c4UjRfNnByNXVLX01uVFk4QTF3ajBJYzZASUQZDZD
THREADS_REDIRECT_URI=https://digitallydefined.online/callback/threads
THREADS_USER_ID:26460916806911110
```

### Email
```
BREVO_API_KEY=[REDACTED]
BREVO_LIST_ID=2
```

### Business
```
GUMROAD_API_KEY=[REDACTED]
EXA_API_KEY=[REDACTED]
AGENTOPS_API_KEY=[REDACTED]
```

### Communication
```
SLACK_BOT_TOKEN=xoxb-5...SDFi
SLACK_APP_TOKEN=xapp-1...3aaa
TELEGRAM_BOT_TOKEN=8741810845:...
TELEGRAM_ALLOWED_USERS=7630632663
```

### AI Gateway (OmniRoute - DEPRECATED)
```
OMNIROUTE_API_KEY=[REDACTED]
OMNIROUTE_BASE_URL=
OMNIROUTE_MODEL=
OMNIROUTE_FALLBACK_MODEL_1=
OMNIROUTE_FALLBACK_MODEL_2=
```

### Antigravity
```
ANTIGRAVITY_API_KEY=[REDACTED]
NOTION_WEBHOOK_SECRET=
```

### Hermes Configuration
```
HERMES_GATEWAY_URL=https://digitallydefined-os-backend.vercel.app/api/hermes
BACKEND_HERMES_URL=https://dijjlppdljpcgyoakdnq.supabase.co/functions/v1/hermes

```

---

## Deployment Instructions

### Option 1: Supabase CLI (Recommended)
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref dijjlppdljpcgyoakdnq

# Deploy function with env file
supabase functions deploy hermes --env-file functions/.env
```

### Option 2: Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/dijjlppdljpcgyoakdnq/edge-functions
2. Click "New Function"
3. Name: `hermes`
4. Copy code from: `functions/hermes.ts`
5. Go to Settings → Environment Variables
6. Paste all variables from: `functions/.env`
7. Click "Deploy"

---

## Testing

After deployment, test the endpoint:

```bash
# Health check
curl https://dijjlppdljpcgyoakdnq.supabase.co/functions/v1/hermes

# Dashboard action
curl -X POST https://dijjlppdljpcgyoakdnq.supabase.co/functions/v1/hermes \
  -H "Content-Type: application/json" \
  -H "x-api-key: DigitallyDefined-OS-2026" \
  -d '{"action":"dashboard"}'

# AI Chat (if OpenRouter key set)
curl -X POST https://dijjlppdljpcgyoakdnq.supabase.co/functions/v1/hermes \
  -H "Content-Type: application/json" \
  -H "x-api-key: DigitallyDefined-OS-2026" \
  -d '{"message":"Hello"}'
```

---

## Status

- ✅ Edge Function Code: `functions/hermes.ts` (388 lines)
- ✅ Environment Variables: `functions/.env` (37 variables)
- ✅ Frontend Updated: Dashboard points to Supabase
- ⏳ Deployment: Manual step required
