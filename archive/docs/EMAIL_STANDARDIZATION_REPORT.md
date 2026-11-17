# EMAIL_STANDARDIZATION_REPORT.md

## Files updated (safe)
- digitallydefined-dashboard/src/pages/StorePage.jsx
- digitallydefined-dashboard/src/config.js
- digitallydefined-dashboard/public/customer-config.js
- digitallydefined-os-backend/src/services/brevo.js
- digitallydefined-os-backend/scripts/bootstrap.cjs

## Flagged for manual review
- digitallydefined-dashboard/src/components/ProtectedRoute.jsx (AUTHORIZED_EMAIL) — changing affects login access; verify new email is registered in Supabase before updating.
- scripts/brevo_triage_imap.py, scripts/brevo_triage.py (EMAIL_USER) — IMAP credentials; update only if mailbox changed.
- archive/docs (support emails) — low priority.

## Auth/API/SMTP impact
No API keys or SMTP config changed. Only display/sender email defaults updated.
