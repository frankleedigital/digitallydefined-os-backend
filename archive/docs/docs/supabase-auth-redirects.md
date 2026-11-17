# Supabase Auth — URL Configuration (apply in Supabase Dashboard)

Project: `dijjlppdljpcgyoakdnq` → Authentication → URL Configuration

These are the values that MUST be set for auth to work on production and localhost.
Supabase rejects redirect URLs not in the allowlist, which surfaces as
"Provider redirect URI is not in the allowlist" errors after login/signup.

## Site URL
```
https://dashboard.digitallydefined.online
```

## Redirect URLs (allowlist)
| URL | Purpose |
|---|---|
| `https://dashboard.digitallydefined.online/**` | Production dashboard (login, signup, email confirm) |
| `http://localhost:5173/**` | Dashboard local dev (Vite default) |
| `https://digitallydefined.online/**` | Marketing site flows, if any use auth |
| `http://localhost:3001/**` | Marketing site local dev (see vite.config.js port) |

## Email templates
Confirm/reset links must use `{{ .SiteURL }}` — verify under
Authentication → Emails → Templates so links land on the right domain.

## OAuth providers (if enabled later)
For each provider (Google, GitHub, etc.):
1. In the provider console, register callback:
   `https://dijjlppdljpcgyoakdnq.supabase.co/auth/v1/callback`
2. Enable the provider in Supabase → Authentication → Providers.
3. Supabase appends the provider to the same redirect allowlist above.

## Verification checklist
- [ ] Signup from `/signup` on prod → confirmation email → link opens dashboard logged-in
- [ ] Login from prod works; logout clears session
- [ ] Same flow works on `localhost:5173`
- [ ] No "redirect not allowed" errors in browser or Supabase logs
