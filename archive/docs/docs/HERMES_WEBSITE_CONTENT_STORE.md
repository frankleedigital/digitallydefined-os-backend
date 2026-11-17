# Hermes "Change the Website" — Live Content Store

Hermes can now change text on the marketing site from the dashboard **Assistant**
(or any chat) and the new copy renders on the site.

## How it works
1. You tell Hermes (dashboard Assistant) to change something on the website, e.g.
   *"Change the homepage headline to: Build Real Digital Assets."*
2. The Hermes edge function's `chat` action detects the edit intent, maps it to an
   editable field, and writes the override to the Supabase `site_content` table.
3. The marketing site (`online-local`) loads overrides at runtime (`siteContent.js`
   + `useSiteContent` hook) merged over hardcoded defaults, so the new copy appears.

## Editable fields (catalog)
Defined in `os-backend/supabase/functions/hermes/index.ts` (`SITE_CONTENT_CATALOG`)
and mirrored in `online-local/src/lib/siteContent.js` (`DEFAULT_SITE_CONTENT`):

- `nav.tagline` — tagline under the logo
- `home.heroEyebrow` — small label above hero headline
- `home.heroHeadline` — main hero headline
- `home.heroTagline` — hero supporting paragraph
- `home.pathHeading` — "One path…" section heading
- `home.finalCtaHeading` — final CTA heading

To add/edit fields: update the catalog in BOTH files, then redeploy.

## New edge-function actions
- `website.content` (public read) — returns merged content (defaults + overrides)
- `website.edit` (authed) — takes `{ message }` (natural language) or `{ key, value }`
  and upserts the override. Also triggered automatically by the `chat` action when
  the user asks for a website change.

## Deploy steps
```bash
# 1. Apply the migration (from os-backend — the canonical repo)
cd digitallydefined-os-backend
supabase db push
#    or: npx supabase db push

# 2. Deploy the Hermes edge function
supabase functions deploy hermes

# 3. Rebuild + deploy BOTH frontends so the new frontend code ships
cd ../digitallydefined-dashboard && pnpm build          # dashboard
cd ../digitallydefined-online-local && pnpm build       # marketing site
```
No new secrets required — the edge already uses `SUPABASE_SERVICE_ROLE_KEY` for
reads/writes and `DASHBOARD_API_KEY` for auth on `website.edit`/`chat`.

## Test
Natural-language (from the dashboard Assistant):
```
Change the homepage headline to: Own Your Future. Build It Faceless.
```
Then open the marketing site homepage. Or call directly:
```bash
curl -s -X POST https://dijjlppdljpcgyoakdnq.supabase.co/functions/v1/hermes \
  -H "Content-Type: application/json" \
  -H "x-api-key: DigitallyDefined-OS-2026" \
  -d '{"action":"website.edit","message":"Change the nav tagline to: Reinvent on your terms."}'
```