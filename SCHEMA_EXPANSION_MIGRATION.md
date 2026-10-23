# SCHEMA_EXPANSION_MIGRATION.md

## Schema changes
Digital Assets DB: added Portfolio Role (select), Launch Date (date), Revenue Goal (number), Asset Stage (select), Build Status (select), Content Pillar (select).
Ideas & Intake DB: added Suggested Assets (rich_text), Digital Independence Score (number).

## Migration plan
1. Add missing properties to live Notion DBs (via Notion UI or API).
2. Backfill existing records.
3. Update env vars if new DBs created (none).
4. Keep existing properties; backward compatible.

## Files modified
- digitallydefined-os-backend/lib/notion-architect.js
- digitallydefined-os-backend/supabase/functions/_shared/notion-architect.ts

## Notion DB updates required
Add the new properties to the live Digital Assets DB and Ideas & Intake DB in Notion.
