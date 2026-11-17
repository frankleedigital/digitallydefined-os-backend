# FINAL_EMAIL_MIGRATION_CHECKLIST.md

## Safe to change now
- Display/support/sender emails (already updated): StorePage, config.js, customer-config.js, brevo.js default, bootstrap.cjs.

## Change after mailbox verification
- ProtectedRoute.jsx AUTHORIZED_EMAIL: change to francesca@digitallydefined.agency only after confirming that email exists in Supabase Auth and can log in.
- brevo_triage IMAP scripts EMAIL_USER: change after mailbox migration confirmed.

## Do not change
- Auth provider internal IDs, OAuth redirect configs, Supabase Auth user records.

## Requires external configuration
- Brevo sender domain verification for digitallydefined.agency.
- Supabase Auth email templates (password reset) sender address.
- DNS MX/SPF/DKIM for new domain.
- IMAP mailbox provisioning.
