-- Migration 007: non-partial unique indexes so PostgREST on_conflict upserts work.
--
-- Migration 006 created *partial* unique indexes (WHERE notion_page_id IS NOT NULL).
-- notion-sync upserts its mirrors with `?on_conflict=notion_page_id` +
-- `Prefer: resolution=merge-duplicates`, and Postgres's ON CONFLICT cannot match a
-- partial index whose predicate the INSERT does not carry -> 42P10
-- "there is no unique or exclusion constraint matching the ON CONFLICT specification".
--
-- A plain unique index fixes it; Postgres treats NULLs as distinct, so rows without a
-- notion_page_id remain allowed in unlimited numbers.
CREATE UNIQUE INDEX IF NOT EXISTS notion_content_blocks_page_id_uq
  ON public.notion_content_blocks (notion_page_id);
CREATE UNIQUE INDEX IF NOT EXISTS notion_templates_page_id_uq
  ON public.notion_templates (notion_page_id);
CREATE UNIQUE INDEX IF NOT EXISTS notion_assets_page_id_uq
  ON public.notion_assets (notion_page_id);
CREATE UNIQUE INDEX IF NOT EXISTS notion_ideas_page_id_uq
  ON public.notion_ideas (notion_page_id);
