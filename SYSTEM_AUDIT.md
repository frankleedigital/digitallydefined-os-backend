# SYSTEM_AUDIT.md
Services: os-backend (node), fastapi (python), dashboard (react/vite), online-local (react), os-workers, supabase edge functions, Hermes agents, R2 storage, Notion sync.
Dependencies: Supabase (DB/auth), R2 (storage), OmniRoute (AI), Brevo (email), Gumroad (payments), Notion (content).
Integration points: REST API, webhooks, env vars, CORS.
Automation flows: quiz->roadmap->Brevo, product packager, website editor (git), community triggers.
Communication: HTTP REST, env-based config, no central message bus.
Missing: centralized event bus, Slack notifications, job queue, unified logging.
