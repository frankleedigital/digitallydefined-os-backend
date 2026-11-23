## DigitallyDefined Migration Notes

### Supabase Service Role Key
The SUPABASE_SERVICE_ROLE_KEY for project dijjjlppdljpcgyoakdnq must be obtained from:
Supabase Dashboard -> Project Settings -> API -> service_role key

Set it in:
- digitallydefined-backend-clean/.env (SUPABASE_SERVICE_ROLE_KEY)
- Vercel environment variables for the deployment

### Vercel Deployment — Environment Variables
Add these env vars to the Vercel project for digitallydefined-backend-clean:

| Variable | Value |
|----------|-------|
| `OMNIROUTE_DISABLED` | `true` — production uses direct Gemini; OmniRoute is local-only |
| `GEMINI_API_KEY` | Your Google Generative Language API key |
| `GEMINI_MODEL` | `gemini-3.6-flash` |
| `VERTEX_PROJECT_ID` | Your GCP Vertex AI project ID |
| `VERTEX_LOCATION` | `us-central1` |
| `VERTEX_MODEL` | `gemini-1.5-flash` |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase Dashboard -> Project Settings -> API |

> **Note:** Never commit real API keys. Use Vercel dashboard environment variables or `.env` files (which are gitignored).
> `OMNIROUTE_BASE_URL` / `OMNIROUTE_API_KEY` are **not** set for Vercel — OmniRoute
> runs locally in Docker at `http://localhost:20128/v1` and is not reachable from
> serverless. There is no public OmniRoute endpoint and no Cloudflare tunnel.

